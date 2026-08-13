import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// TEMPORARY route - remove this file and its registration in routes/index.ts
// once the super admin password has been reset. Protected by a secret that
// must match RESET_ADMIN_SECRET on Vercel - never guessable, never logged.

const router: IRouter = Router();

router.post("/", async (req: any, res: any) => {
  const { secret, newPassword, email, name } = req.body || {};
  const expectedSecret = process.env.RESET_ADMIN_SECRET;

  if (!expectedSecret) {
    return res.status(503).json({ error: "RESET_ADMIN_SECRET not configured on this deployment" });
  }
  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "newPassword must be at least 8 characters" });
  }
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (existing.length > 0) {
      const result = await db
        .update(usersTable)
        .set({ passwordHash: hash, status: "active", role: "admin" })
        .where(eq(usersTable.email, email))
        .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

      return res.json({ success: true, action: "updated", user: result[0] });
    } else {
      const result = await db
        .insert(usersTable)
        .values({
          name: name || "Super Admin",
          email,
          passwordHash: hash,
          role: "admin",
          status: "active",
        })
        .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

      return res.json({ success: true, action: "created", user: result[0] });
    }
  } catch (err) {
    return res.status(500).json({ error: "Reset failed", detail: (err as Error).message });
  }
});

export default router;