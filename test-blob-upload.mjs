// test-blob-upload.mjs
//
// Quick local test to confirm BLOB_READ_WRITE_TOKEN actually works
// before you rely on it in production.
//
// USAGE:
//   1. npm install @vercel/blob   (if not already a project dependency)
//   2. Set the token for this shell session only (does not persist):
//        PowerShell:  $env:BLOB_READ_WRITE_TOKEN = "paste-token-here"
//        bash/zsh:    export BLOB_READ_WRITE_TOKEN="paste-token-here"
//   3. node test-blob-upload.mjs
//
// This uploads a small private test file and then confirms it can be
// read back. It does NOT touch your production app or database.

import { put, head } from "@vercel/blob";

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN is not set in this shell session.");
    console.error("Set it first, then re-run this script.");
    process.exit(1);
  }

  console.log("Token found (length:", token.length, "chars). Attempting upload...");

  try {
    const blob = await put(
      "diagnostics/blob-test.txt",
      `Test upload at ${new Date().toISOString()}`,
      { access: "private", token }
    );

    console.log("Upload succeeded.");
    console.log("  url:", blob.url);
    console.log("  pathname:", blob.pathname);

    console.log("");
    console.log("Verifying the blob can be read back via head()...");
    const info = await head(blob.url, { token });
    console.log("Read-back succeeded.");
    console.log("  size:", info.size, "bytes");
    console.log("  uploadedAt:", info.uploadedAt);

    console.log("");
    console.log("SUCCESS: BLOB_READ_WRITE_TOKEN is valid and working.");
    console.log("Safe to add this token to Vercel's Production/Preview env vars and redeploy.");
  } catch (err) {
    console.error("");
    console.error("FAILED: token did not work as expected.");
    console.error("Error details:", err.message || err);
    console.error("");
    console.error("Common causes:");
    console.error("  - Token was copied incorrectly (truncated/extra whitespace)");
    console.error("  - Token belongs to a different/orphaned store (the BLOB_STORE_ID conflict)");
    console.error("  - Token has already been revoked/rotated");
    process.exit(1);
  }
}

main();
