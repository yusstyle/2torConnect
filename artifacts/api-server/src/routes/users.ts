import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ilike, or, count, and } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { role, status, search } = req.query;

    const conditions = [];
    if (role) conditions.push(eq(usersTable.role, role as any));
    if (status) conditions.push(eq(usersTable.status, status as any));
    if (search) {
      conditions.push(or(
        ilike(usersTable.name, `%${search}%`),
        ilike(usersTable.email, `%${search}%`)
      )!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const users = await db.select().from(usersTable).where(where).limit(limit).offset(offset).orderBy(usersTable.createdAt);
    const [{ value: total }] = await db.select({ value: count() }).from(usersTable).where(where);

    res.json({
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status, createdAt: u.createdAt, lastLogin: u.lastLogin })),
      total: Number(total),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "list users error");
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin });
  } catch (err) {
    req.log.error({ err }, "get user error");
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = UpdateUserBody.parse(req.body);
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin });
  } catch (err) {
    req.log.error({ err }, "update user error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
