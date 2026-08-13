import { db } from "./src/index";
import { usersTable } from "./src/schema/users";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const newPassword = process.env.NEW_ADMIN_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL || "admin@2torconnect.com";

if (!newPassword) {
  console.error("NEW_ADMIN_PASSWORD env var is required.");
  process.exit(1);
}

const hash = await bcrypt.hash(newPassword, 10);
const result = await db
  .update(usersTable)
  .set({ passwordHash: hash, status: "active" })
  .where(eq(usersTable.email, adminEmail))
  .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

if (result.length === 0) {
  console.error(`No user found with email ${adminEmail}. Nothing was changed.`);
  process.exit(1);
}

console.log("Password reset for:", result[0]);
process.exit(0);
