import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding username column to users table...");
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`);
    console.log("Column added (or already exists)");
  } catch (e: any) {
    console.log("Column note:", e.message);
  }
  try {
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE username IS NOT NULL`);
    console.log("Unique index added (or already exists)");
  } catch (e: any) {
    console.log("Index note:", e.message);
  }
  console.log("Done.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
