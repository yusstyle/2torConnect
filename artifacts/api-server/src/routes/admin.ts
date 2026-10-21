import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, transactionsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { sendCustomEmail } from "../lib/email";
import { requireAdmin } from "../lib/auth-middleware";

const router: IRouter = Router();

// GET /admin/stats - strictly protected: Admin access only
router.get("/stats", requireAdmin, async (req, res) => {
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

// POST /admin/send-email -- send a message to one user or to everyone
router.post("/send-email", requireAdmin, async (req: any, res) => {
  try {
    const { recipientType, userId, subject, message, mediaUrl, mediaType } = req.body;
    if (!subject || !message) { res.status(400).json({ error: "Subject and message are required" }); return; }

    if (recipientType === "single") {
      if (!userId) { res.status(400).json({ error: "userId is required for a single recipient" }); return; }
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId))).limit(1);
      if (!user) { res.status(404).json({ error: "User not found" }); return; }
      const ok = await sendCustomEmail(user.email, subject, message, mediaUrl, mediaType);
      res.json({ sent: ok ? 1 : 0, failed: ok ? 0 : 1 });
      return;
    }

    if (recipientType === "all") {
      const users = await db.select({ email: usersTable.email }).from(usersTable);
      let sent = 0, failed = 0;
      const BATCH_SIZE = 25;
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(u => sendCustomEmail(u.email, subject, message, mediaUrl, mediaType)));
        sent += results.filter(Boolean).length;
        failed += results.filter(r => !r).length;
      }
      res.json({ sent, failed });
      return;
    }

    res.status(400).json({ error: "recipientType must be 'single' or 'all'" });
  } catch (err) {
    console.error("send-email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
