import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

const SUPER_ADMIN_EMAIL = "admin2-yusstyle@gmail.com";

function requireSuperAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), "base64").toString("utf8"));
    if (payload.email !== SUPER_ADMIN_EMAIL) {
      res.status(403).json({ error: "Forbidden: Super Admin only" });
      return;
    }
    req.authUser = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.get("/admins", requireSuperAdmin, async (req, res) => {
  try {
    const admins = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, status: usersTable.status, createdAt: usersTable.createdAt, lastLogin: usersTable.lastLogin })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));
    const filtered = admins.filter(a => a.email !== SUPER_ADMIN_EMAIL);
    res.json({ admins: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to list admins" });
  }
});

router.post("/admins", requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }
    if (email.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
      res.status(400).json({ error: "Cannot create an admin with this email" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "admin",
      status: "active",
    }).returning();
    res.status(201).json({ admin: { id: user.id, name: user.name, email: user.email, status: user.status, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create admin", message: String(err) });
  }
});

router.patch("/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { password, status } = req.body;
    const updates: any = {};
    if (password?.trim()) updates.passwordHash = await bcrypt.hash(password, 10);
    if (status) updates.status = status;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    const [user] = await db.update(usersTable).set(updates).where(and(eq(usersTable.id, id), eq(usersTable.role, "admin"))).returning();
    if (!user) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }
    res.json({ admin: { id: user.id, name: user.name, email: user.email, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: "Failed to update admin" });
  }
});

router.delete("/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.role, "admin"))).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }
    if (existing.email === SUPER_ADMIN_EMAIL) {
      res.status(403).json({ error: "Cannot delete the super admin" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

export default router;
