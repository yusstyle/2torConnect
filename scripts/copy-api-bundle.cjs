const { copyFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

const source = path.resolve(process.cwd(), "artifacts/api-server/dist/app.cjs");
const destDir = path.resolve(process.cwd(), "api");
const dest = path.resolve(destDir, "app.cjs");

async function main() {
  await mkdir(destDir, { recursive: true });
  await copyFile(source, dest);
  console.log(`Copied ${source} -> ${dest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
