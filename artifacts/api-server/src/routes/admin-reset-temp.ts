import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// TEMPORARY route - remove this file and its registration in routes/index.ts
// once the super admin password has been reset. Protected by a secret that
// must match RESET_ADMIN_SECRET on Vercel - never guessable, never logged.

const router: IRouter = Router();

router.post("/", async (req: any, res: any) => {
  const { secret, newPassword, email } = req.body || {};
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

  const targetEmail = email || "admin@2torconnect.com";

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await db
      .update(usersTable)
      .set({ passwordHash: hash, status: "active" })
      .where(eq(usersTable.email, targetEmail))
      .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

    if (result.length === 0) {
      return res.status(404).json({ error: `No user found with email ${targetEmail}` });
    }

    return res.json({ success: true, user: result[0] });
  } catch (err) {
    return res.status(500).json({ error: "Reset failed", detail: (err as Error).message });
  }
});

export default router;