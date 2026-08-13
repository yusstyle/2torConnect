import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./src/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const newPassword = process.env.NEW_ADMIN_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL || "admin@2torconnect.com";
const connectionString = process.env.DATABASE_URL;

if (!newPassword) {
  console.error("NEW_ADMIN_PASSWORD env var is required.");
  process.exit(1);
}
if (!connectionString) {
  console.error("DATABASE_URL env var is required.");
  process.exit(1);
}

console.log("Connecting using DATABASE_URL only (length:", connectionString.length, "chars)");

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });
const usersTable = schema.usersTable;

const hash = await bcrypt.hash(newPassword, 10);
const result = await db
  .update(usersTable)
  .set({ passwordHash: hash, status: "active" })
  .where(eq(usersTable.email, adminEmail))
  .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

if (result.length === 0) {
  console.error(`No user found with email ${adminEmail}. Nothing was changed.`);
  await pool.end();
  process.exit(1);
}

console.log("Password reset for:", result[0]);
await pool.end();
process.exit(0);