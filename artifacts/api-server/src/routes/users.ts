import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, tutorsTable } from "@workspace/db";
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

    const userIds = users.map(u => u.id);
    const studentMap = new Map<number, any>();
    const tutorMap = new Map<number, any>();
    if (userIds.length > 0) {
      const sRows = await db.select().from(studentsTable);
      for (const s of sRows) if (userIds.includes(s.userId)) studentMap.set(s.userId, s);
      const tRows = await db.select().from(tutorsTable);
      for (const t of tRows) if (userIds.includes(t.userId)) tutorMap.set(t.userId, t);
    }

    res.json({
      users: users.map(u => {
        const s = studentMap.get(u.id);
        const t = tutorMap.get(u.id);
        return {
          id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status,
          avatarUrl: u.avatarUrl ?? null, createdAt: u.createdAt, lastLogin: u.lastLogin,
          university: s?.university ?? t?.university ?? null,
          level: s?.admissionType ?? t?.level ?? null,
          subjects: t?.subjects ?? null,
          aboutYou: t?.aboutYou ?? null,
        };
      }),
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
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, avatarUrl: user.avatarUrl ?? null, createdAt: user.createdAt, lastLogin: user.lastLogin });
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
    if ("phone" in body) updateData.phone = body.phone ?? null;
    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, avatarUrl: user.avatarUrl ?? null, createdAt: user.createdAt, lastLogin: user.lastLogin });
  } catch (err) {
    req.log.error({ err }, "update user error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
