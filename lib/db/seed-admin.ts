import { db } from "./src/index";
import { usersTable } from "./src/schema/users";
import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("admin@2tor2024", 10);
const result = await db
  .insert(usersTable)
  .values({
    name: "Super Admin",
    email: "admin@2torconnect.com",
    passwordHash: hash,
    role: "admin",
    status: "active",
  })
  .onConflictDoUpdate({
    target: usersTable.email,
    set: { passwordHash: hash, status: "active" },
  })
  .returning({ id: usersTable.id, email: usersTable.email });

console.log("✅ Admin account ready:", result[0]);
process.exit(0);
