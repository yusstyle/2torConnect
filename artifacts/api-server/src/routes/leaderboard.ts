import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, sessionsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";

const router = Router();

router.get("/tutors", async (req, res) => {
  try {
    const rows = await db
      .select({
        userId: tutorsTable.userId,
        name: usersTable.name,
        avatarUrl: usersTable.avatarUrl,
        university: tutorsTable.university,
        subjects: tutorsTable.subjects,
        rating: tutorsTable.rating,
        totalSessions: tutorsTable.totalSessions,
        hourlyRate: tutorsTable.hourlyRate,
      })
      .from(tutorsTable)
      .innerJoin(usersTable, eq(tutorsTable.userId, usersTable.id))
      .where(eq(usersTable.status, "active"))
      .orderBy(desc(tutorsTable.totalSessions))
      .limit(20);

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get("/students", async (req, res) => {
  try {
    const sessionCounts = await db
      .select({
        studentId: sessionsTable.studentId,
        sessionCount: count(),
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "completed"))
      .groupBy(sessionsTable.studentId)
      .orderBy(desc(count()))
      .limit(20);

    if (sessionCounts.length === 0) return res.json([]);

    const enriched = await Promise.all(
      sessionCounts.map(async ({ studentId, sessionCount }) => {
        const [user] = await db
          .select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
          .from(usersTable)
          .where(eq(usersTable.id, studentId));
        return { studentId, sessionCount, name: user?.name ?? "Unknown", avatarUrl: user?.avatarUrl };
      })
    );

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
