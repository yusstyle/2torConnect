import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sponsorshipRequestsTable, usersTable, studentsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7), "base64").toString("utf8"));
    req.authUser = payload;
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
}

router.get("/", async (req, res) => {
  try {
    const { university, status, studentId } = req.query;
    const rows = await db
      .select({
        id: sponsorshipRequestsTable.id,
        studentId: sponsorshipRequestsTable.studentId,
        title: sponsorshipRequestsTable.title,
        story: sponsorshipRequestsTable.story,
        amountNeeded: sponsorshipRequestsTable.amountNeeded,
        category: sponsorshipRequestsTable.category,
        university: sponsorshipRequestsTable.university,
        status: sponsorshipRequestsTable.status,
        createdAt: sponsorshipRequestsTable.createdAt,
        studentName: usersTable.name,
        studentEmail: usersTable.email,
        studentAvatar: usersTable.avatarUrl,
      })
      .from(sponsorshipRequestsTable)
      .innerJoin(usersTable, eq(sponsorshipRequestsTable.studentId, usersTable.id))
      .where(
        and(
          university ? eq(sponsorshipRequestsTable.university, university as string) : undefined,
          status ? eq(sponsorshipRequestsTable.status, status as string) : undefined,
          studentId ? eq(sponsorshipRequestsTable.studentId, Number(studentId)) : undefined,
        )
      )
      .orderBy(desc(sponsorshipRequestsTable.createdAt))
      .limit(100);
    res.json({ requests: rows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list sponsorship requests", message: err.message });
  }
});

router.post("/", authMiddleware, async (req: any, res) => {
  try {
    if (req.authUser.role !== "student") {
      res.status(403).json({ error: "Only students can post sponsorship requests" }); return;
    }
    const { title, story, amountNeeded, category, university } = req.body;
    if (!title?.trim()) { res.status(400).json({ error: "Title is required" }); return; }
    if (!story?.trim()) { res.status(400).json({ error: "Story is required" }); return; }

    const [existing] = await db
      .select({ university: studentsTable.university })
      .from(studentsTable)
      .where(eq(studentsTable.userId, req.authUser.id))
      .limit(1);

    const [request] = await db.insert(sponsorshipRequestsTable).values({
      studentId: req.authUser.id,
      title: title.trim(),
      story: story.trim(),
      amountNeeded: amountNeeded ? String(Number(amountNeeded).toFixed(2)) : null,
      category: category ?? "general",
      university: university ?? existing?.university ?? null,
      status: "open",
    }).returning();
    res.status(201).json({ request });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create sponsorship request", message: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(sponsorshipRequestsTable).where(eq(sponsorshipRequestsTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    if (row.studentId !== req.authUser.id && req.authUser.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    await db.delete(sponsorshipRequestsTable).where(eq(sponsorshipRequestsTable.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete request", message: err.message });
  }
});

export default router;
