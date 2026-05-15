import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, sessionParticipantsTable, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { pushNotification } from "./notifications";

const router = Router();

// GET /api/groups — list open group sessions available to join
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: sessionsTable.id,
        subject: sessionsTable.subject,
        scheduledAt: sessionsTable.scheduledAt,
        durationMinutes: sessionsTable.durationMinutes,
        maxStudents: sessionsTable.maxStudents,
        notes: sessionsTable.notes,
        tutorId: sessionsTable.tutorId,
        tutorName: usersTable.name,
        tutorAvatar: usersTable.avatarUrl,
        amount: sessionsTable.amount,
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.tutorId, usersTable.id))
      .where(and(eq(sessionsTable.isGroupSession, true), eq(sessionsTable.status, "confirmed")))
      .orderBy(sessionsTable.scheduledAt)
      .limit(50);

    // Attach participant count to each
    const enriched = await Promise.all(rows.map(async (s) => {
      const [{ value: joined }] = await db
        .select({ value: count() })
        .from(sessionParticipantsTable)
        .where(eq(sessionParticipantsTable.sessionId, s.id));
      return { ...s, joinedCount: Number(joined) };
    }));

    res.json(enriched.filter(s => s.joinedCount < s.maxStudents));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group sessions" });
  }
});

// POST /api/groups — tutor creates a group session
router.post("/", async (req, res) => {
  try {
    const tutorId = Number((req as any).user?.id);
    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });
    const { subject, scheduledAt, durationMinutes, maxStudents, notes, amount } = req.body;
    if (!subject || !scheduledAt || !maxStudents) {
      return res.status(400).json({ error: "subject, scheduledAt, maxStudents required" });
    }

    const [session] = await db.insert(sessionsTable).values({
      tutorId,
      studentId: tutorId, // placeholder
      subject,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes ?? 60,
      isGroupSession: true,
      maxStudents: Number(maxStudents),
      status: "confirmed",
      notes: notes ?? null,
      amount: amount ? String(amount) : null,
    }).returning();

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group session" });
  }
});

// POST /api/groups/:id/join — student joins a group session
router.post("/:id/join", async (req, res) => {
  try {
    const studentId = Number((req as any).user?.id);
    const sessionId = Number(req.params.id);
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.isGroupSession) return res.status(400).json({ error: "Not a group session" });

    // Check capacity
    const [{ value: joined }] = await db
      .select({ value: count() })
      .from(sessionParticipantsTable)
      .where(eq(sessionParticipantsTable.sessionId, sessionId));
    if (Number(joined) >= session.maxStudents) {
      return res.status(400).json({ error: "Session is full" });
    }

    // Check not already joined
    const existing = await db.select({ id: sessionParticipantsTable.id })
      .from(sessionParticipantsTable)
      .where(and(eq(sessionParticipantsTable.sessionId, sessionId), eq(sessionParticipantsTable.studentId, studentId)));
    if (existing.length > 0) return res.status(400).json({ error: "Already joined" });

    await db.insert(sessionParticipantsTable).values({ sessionId, studentId });

    // Notify tutor
    const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, studentId));
    await pushNotification(session.tutorId, "group", "Student Joined Group Session", `${student?.name ?? "A student"} joined your group session: ${session.subject}`, `/session/${sessionId}`);

    res.json({ success: true, sessionId, roomId: `2torconnect-session-${sessionId}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to join group session" });
  }
});

// GET /api/groups/:id/participants
router.get("/:id/participants", async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const rows = await db
      .select({
        id: sessionParticipantsTable.id,
        studentId: sessionParticipantsTable.studentId,
        joinedAt: sessionParticipantsTable.joinedAt,
        name: usersTable.name,
        avatarUrl: usersTable.avatarUrl,
      })
      .from(sessionParticipantsTable)
      .innerJoin(usersTable, eq(sessionParticipantsTable.studentId, usersTable.id))
      .where(eq(sessionParticipantsTable.sessionId, sessionId));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch participants" });
  }
});

export default router;
