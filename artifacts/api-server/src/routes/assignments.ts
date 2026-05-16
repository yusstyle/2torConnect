import { Router } from "express";
import { db } from "@workspace/db";
import { assignmentsTable, assignmentResponsesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { pushNotification } from "./notifications";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    const role = (req as any).user?.role;
    const { status, mine } = req.query;

    let query = db
      .select({
        id: assignmentsTable.id,
        subject: assignmentsTable.subject,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        deadline: assignmentsTable.deadline,
        status: assignmentsTable.status,
        createdAt: assignmentsTable.createdAt,
        studentId: assignmentsTable.studentId,
        studentName: usersTable.name,
        studentAvatar: usersTable.avatarUrl,
      })
      .from(assignmentsTable)
      .innerJoin(usersTable, eq(assignmentsTable.studentId, usersTable.id));

    const conditions = [];
    if (mine === "true" || role === "student") {
      conditions.push(eq(assignmentsTable.studentId, userId));
    }
    if (status) {
      conditions.push(eq(assignmentsTable.status, status as any));
    } else if (role === "tutor") {
      conditions.push(eq(assignmentsTable.status, "open"));
    }

    const rows = await query
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(assignmentsTable.createdAt))
      .limit(100);

    const enriched = await Promise.all(rows.map(async (a) => {
      const responses = await db
        .select({ id: assignmentResponsesTable.id })
        .from(assignmentResponsesTable)
        .where(eq(assignmentResponsesTable.assignmentId, a.id));
      return { ...a, responseCount: responses.length };
    }));

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [assignment] = await db
      .select({
        id: assignmentsTable.id,
        subject: assignmentsTable.subject,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        deadline: assignmentsTable.deadline,
        status: assignmentsTable.status,
        createdAt: assignmentsTable.createdAt,
        studentId: assignmentsTable.studentId,
        studentName: usersTable.name,
      })
      .from(assignmentsTable)
      .innerJoin(usersTable, eq(assignmentsTable.studentId, usersTable.id))
      .where(eq(assignmentsTable.id, id));

    if (!assignment) return res.status(404).json({ error: "Not found" });

    const responses = await db
      .select({
        id: assignmentResponsesTable.id,
        response: assignmentResponsesTable.response,
        createdAt: assignmentResponsesTable.createdAt,
        tutorId: assignmentResponsesTable.tutorId,
        tutorName: usersTable.name,
        tutorAvatar: usersTable.avatarUrl,
      })
      .from(assignmentResponsesTable)
      .innerJoin(usersTable, eq(assignmentResponsesTable.tutorId, usersTable.id))
      .where(eq(assignmentResponsesTable.assignmentId, id))
      .orderBy(desc(assignmentResponsesTable.createdAt));

    return res.json({ ...assignment, responses });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

router.post("/", async (req, res) => {
  try {
    const studentId = Number((req as any).user?.id);
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });
    const { subject, title, description, deadline } = req.body;
    if (!subject || !title || !description) {
      return res.status(400).json({ error: "subject, title, description required" });
    }
    const [a] = await db.insert(assignmentsTable).values({
      studentId,
      subject,
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
    }).returning();
    return res.status(201).json(a);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create assignment" });
  }
});

router.post("/:id/respond", async (req, res) => {
  try {
    const tutorId = Number((req as any).user?.id);
    const assignmentId = Number(req.params.id);
    const { response } = req.body;
    if (!response?.trim()) return res.status(400).json({ error: "Response required" });

    const [resp] = await db.insert(assignmentResponsesTable).values({
      assignmentId,
      tutorId,
      response,
    }).returning();

    await db.update(assignmentsTable).set({ status: "answered" }).where(eq(assignmentsTable.id, assignmentId));

    const [asgn] = await db.select({ studentId: assignmentsTable.studentId, title: assignmentsTable.title }).from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
    const [tutor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, tutorId));
    if (asgn) {
      await pushNotification(
        asgn.studentId,
        "assignment",
        "Assignment Answered!",
        `${tutor?.name ?? "A tutor"} responded to your question: "${asgn.title}"`,
        "/student/assignments"
      );
    }

    return res.status(201).json(resp);
  } catch (err) {
    return res.status(500).json({ error: "Failed to submit response" });
  }
});

router.patch("/:id/close", async (req, res) => {
  try {
    const studentId = Number((req as any).user?.id);
    const id = Number(req.params.id);
    await db.update(assignmentsTable).set({ status: "closed" }).where(and(eq(assignmentsTable.id, id), eq(assignmentsTable.studentId, studentId)));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to close assignment" });
  }
});

export default router;
