import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, studentsTable, transactionsTable, sessionsTable, reviewsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const [studentsResult] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.role, "student"));
    const [tutorsResult] = await db.select({ value: count() }).from(tutorsTable).where(eq(tutorsTable.isVerified, true));
    const [sessionsResult] = await db.select({ value: count() }).from(sessionsTable);
    const [earningsResult] = await db.select({ value: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.status, "completed"));

    const combined = await db.execute(
      sql`SELECT COUNT(*) as value FROM (
        SELECT university FROM tutors WHERE university IS NOT NULL
        UNION
        SELECT university FROM students WHERE university IS NOT NULL
      ) u`
    );

    const recentUsers = await db
      .select({ id: usersTable.id, name: usersTable.name, role: usersTable.role, status: usersTable.status, createdAt: usersTable.createdAt })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(8);

    // Monthly signups for the last 7 months
    const monthlySignups = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'Mon') as month,
             EXTRACT(MONTH FROM created_at) as month_num,
             COUNT(*) as users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 months'
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    // Monthly sessions for the last 7 months
    const monthlySessions = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'Mon') as month,
             EXTRACT(MONTH FROM created_at) as month_num,
             COUNT(*) as sessions
      FROM sessions
      WHERE created_at >= NOW() - INTERVAL '7 months'
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    // Monthly revenue
    const monthlyRevenue = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'Mon') as month,
             EXTRACT(MONTH FROM created_at) as month_num,
             COALESCE(SUM(amount), 0) as revenue
      FROM transactions
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '7 months'
      GROUP BY month, month_num
      ORDER BY month_num
    `);

    // User role breakdown
    const roleBreakdown = await db.execute(sql`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `);

    // Merge monthly data by month name
    const monthMap: Record<string, any> = {};
    for (const row of monthlySignups.rows as any[]) {
      monthMap[row.month] = { month: row.month, users: Number(row.users), sessions: 0, revenue: 0 };
    }
    for (const row of monthlySessions.rows as any[]) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, users: 0, sessions: 0, revenue: 0 };
      monthMap[row.month].sessions = Number(row.sessions);
    }
    for (const row of monthlyRevenue.rows as any[]) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, users: 0, sessions: 0, revenue: 0 };
      monthMap[row.month].revenue = Number(row.revenue);
    }
    const chartData = Object.values(monthMap);

    res.json({
      totalStudents: Number(studentsResult.value),
      totalTutors: Number(tutorsResult.value),
      totalSessions: Number(sessionsResult.value),
      totalRevenue: Number(earningsResult.value ?? 0),
      universities: Number((combined.rows[0] as any).value),
      recentUsers,
      chartData,
      roleBreakdown: (roleBreakdown.rows as any[]).map(r => ({ role: r.role, count: Number(r.count) })),
    });
  } catch (err) {
    req.log.error({ err }, "stats error");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
