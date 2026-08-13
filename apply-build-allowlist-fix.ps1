# apply-build-allowlist-fix.ps1
# Run this from the root of your 2torConnect repo (in PowerShell / pwsh).
#
# Root cause (from your Vercel logs): the deployed API bundle throws
#   Cannot find module '@vercel/blob'
# at boot, which crashes the ENTIRE backend (every route, not just login).
# @vercel/blob and bcryptjs were left out of the esbuild bundle allowlist in
# artifacts/api-server/build.ts, so they're required from node_modules at
# runtime instead of being bundled in -- and Vercel's dependency tracing
# doesn't reliably follow pnpm's symlinked node_modules for this project's
# custom /api functions, so those two modules silently don't make it into
# the deployed lambda. This writes the fixed build.ts (both added to the
# allowlist so they get compiled directly into app.cjs), then stages,
# commits, and pushes it.

$ErrorActionPreference = "Stop"

$targetPath = "artifacts/api-server/build.ts"

$content = @'
import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times without risking some
// packages that are not bundle compatible
const allowlist = [
  "@google/generative-ai",
  "@vercel/blob",
  "axios",
  "bcryptjs",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "pino",
  "pino-http",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

  console.log("building server...");
  const pkgPath = path.resolve(__dirname, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter(
    (dep) =>
      !allowlist.includes(dep) &&
      !(pkg.dependencies?.[dep]?.startsWith("workspace:")),
  );

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "index.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/app.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "app.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

'@

Set-Content -Path $targetPath -Value $content -NoNewline -Encoding utf8

Write-Host "Wrote $targetPath"

git add $targetPath
git status --short

git commit -m "fix: bundle @vercel/blob and bcryptjs into api-server build instead of leaving them external (fixes MODULE_NOT_FOUND on Vercel)"

git push

Write-Host "Done. Vercel should auto-redeploy from this push. Once it finishes, try logging in again."
Write-Host "If you want to double check, re-run your vercel-get-full-logs.ps1 after the new deployment finishes."