import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, tutorsTable, usersTable } from "@workspace/db";
import { eq, avg, count, desc } from "drizzle-orm";
import { pushNotification } from "./notifications";

const router = Router();

// GET /api/reviews?tutorId=X
router.get("/", async (req, res) => {
  try {
    const tutorId = Number(req.query.tutorId);
    if (!tutorId) return res.status(400).json({ error: "tutorId required" });
    const rows = await db
      .select({
        id: reviewsTable.id,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        studentName: usersTable.name,
        studentAvatar: usersTable.avatarUrl,
      })
      .from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.studentId, usersTable.id))
      .where(eq(reviewsTable.tutorId, tutorId))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(50);

    const [stats] = await db
      .select({ avg: avg(reviewsTable.rating), total: count() })
      .from(reviewsTable)
      .where(eq(reviewsTable.tutorId, tutorId));

    res.json({ reviews: rows, avgRating: stats?.avg ?? null, total: Number(stats?.total ?? 0) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/reviews
router.post("/", async (req, res) => {
  try {
    const { tutorId, sessionId, rating, comment } = req.body;
    const studentId = Number((req as any).user?.id);
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });
    if (!tutorId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "tutorId and rating (1–5) required" });
    }

    const [review] = await db.insert(reviewsTable).values({
      tutorId: Number(tutorId),
      studentId,
      sessionId: sessionId ? Number(sessionId) : null,
      rating: Number(rating),
      comment: comment || null,
    }).returning();

    // Update tutor average rating
    const [stats] = await db
      .select({ avg: avg(reviewsTable.rating) })
      .from(reviewsTable)
      .where(eq(reviewsTable.tutorId, Number(tutorId)));
    if (stats?.avg) {
      await db
        .update(tutorsTable)
        .set({ rating: String(Number(stats.avg).toFixed(1)) })
        .where(eq(tutorsTable.userId, Number(tutorId)));
    }

    // Notify tutor
    const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, studentId));
    await pushNotification(
      Number(tutorId),
      "review",
      "New Review Received",
      `${student?.name ?? "A student"} left you a ${rating}-star review.`,
      "/tutor/dashboard"
    );

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
