import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { CreateSessionBody, UpdateSessionBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichSession(session: typeof sessionsTable.$inferSelect) {
  const [tutor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, session.tutorId)).limit(1);
  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, session.studentId)).limit(1);
  return {
    ...session,
    tutorName: tutor?.name ?? "Unknown",
    studentName: student?.name ?? "Unknown",
  };
}

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { tutorId, studentId, status } = req.query;

    const conditions = [];
    if (tutorId) conditions.push(eq(sessionsTable.tutorId, Number(tutorId)));
    if (studentId) conditions.push(eq(sessionsTable.studentId, Number(studentId)));
    if (status) conditions.push(eq(sessionsTable.status, status as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sessions = await db.select().from(sessionsTable).where(where).limit(limit).offset(offset).orderBy(sessionsTable.scheduledAt);
    const [{ value: total }] = await db.select({ value: count() }).from(sessionsTable).where(where);

    const enriched = await Promise.all(sessions.map(enrichSession));
    res.json({ sessions: enriched, total: Number(total), page, limit });
  } catch (err) {
    req.log.error({ err }, "list sessions error");
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateSessionBody.parse(req.body);
    const [session] = await db.insert(sessionsTable).values({
      tutorId: body.tutorId,
      studentId: body.studentId,
      subject: body.subject,
      scheduledAt: new Date(body.scheduledAt),
      durationMinutes: body.durationMinutes ?? 60,
      amount: body.amount ?? null,
      notes: body.notes ?? null,
      status: "pending",
    }).returning();
    const enriched = await enrichSession(session);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "create session error");
    res.status(400).json({ error: "Failed to create session", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const enriched = await enrichSession(session);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "get session error");
    res.status(500).json({ error: "Failed to get session" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = UpdateSessionBody.parse(req.body);
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.notes) updateData.notes = body.notes;
    const [session] = await db.update(sessionsTable).set(updateData).where(eq(sessionsTable.id, id)).returning();
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const enriched = await enrichSession(session);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "update session error");
    res.status(500).json({ error: "Failed to update session" });
  }
});

export default router;
