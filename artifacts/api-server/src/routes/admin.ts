import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, transactionsTable, tutorsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const [{ total: totalUsers }] = await db.select({ total: count() }).from(usersTable);
    const [{ total: totalStudents }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "student"));
    const [{ total: totalTutors }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "tutor"));
    const [{ total: totalSessions }] = await db.select({ total: count() }).from(sessionsTable);
    const [{ total: pendingTutors }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.status, "pending"));
    const [{ total: activeSessions }] = await db.select({ total: count() }).from(sessionsTable).where(eq(sessionsTable.status, "confirmed"));

    const revenueResult = await db.select({ sum: sql<string>`COALESCE(SUM(amount::numeric), 0)` }).from(transactionsTable).where(eq(transactionsTable.status, "completed"));
    const totalRevenue = revenueResult[0]?.sum ?? "0";

    const recentUsersRaw = await db.select().from(usersTable).orderBy(usersTable.createdAt).limit(5);
    const recentUsers = recentUsersRaw.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status, createdAt: u.createdAt, lastLogin: u.lastLogin,
    }));

    const recentSessionsRaw = await db.select().from(sessionsTable).orderBy(sessionsTable.createdAt).limit(5);
    const recentSessions = await Promise.all(recentSessionsRaw.map(async s => {
      const [tutor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, s.tutorId)).limit(1);
      const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, s.studentId)).limit(1);
      return { ...s, tutorName: tutor?.name ?? "Unknown", studentName: student?.name ?? "Unknown" };
    }));

    res.json({
      totalUsers: Number(totalUsers),
      totalStudents: Number(totalStudents),
      totalTutors: Number(totalTutors),
      totalSessions: Number(totalSessions),
      totalRevenue,
      pendingTutors: Number(pendingTutors),
      activeSessions: Number(activeSessions),
      recentUsers,
      recentSessions,
    });
  } catch (err) {
    req.log.error({ err }, "admin stats error");
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

export default router;
