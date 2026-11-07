import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { sendCustomEmail } from "../lib/email";
import { requireAdmin } from "../lib/auth-middleware";
import { initSecurityTable } from "../lib/security";
import { pushNotification } from "./notifications";
import { enqueueBroadcast, processEmailQueue, getEmailQueueStatus } from "../lib/email-queue";

const router: IRouter = Router();

// GET /admin/stats - strictly protected: Admin access only
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [{ total: totalUsers }] = await db.select({ total: count() }).from(usersTable);
    const [{ total: totalStudents }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "student"));
    const [{ total: totalTutors }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "tutor"));
    const [{ total: totalSessions }] = await db.select({ total: count() }).from(sessionsTable);

    // Calculate total platform revenue from completed payments & confirmed sessions
    const revenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total_revenue
      FROM transactions
      WHERE status = 'completed' AND (description LIKE 'Payment for%' OR description LIKE 'Wallet%' OR type = 'payment')
    `);

    const sessionRevenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total_session_revenue
      FROM sessions
      WHERE is_paid = 1 OR status = 'completed'
    `);

    const totalRevenue = Math.max(
      Number(revenueResult.rows[0]?.total_revenue ?? 0),
      Number(sessionRevenueResult.rows[0]?.total_session_revenue ?? 0)
    );

    // Continuous 6-month rolling timeline (e.g. Jun, Jul, Aug, Sep, Oct, Nov)
    const chartMonths: { key: string; month: string; revenue: number; sessions: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const month = d.toLocaleString("en-US", { month: "short" });
      chartMonths.push({ key, month, revenue: 0, sessions: 0 });
    }

    // Monthly revenue from transactions
    const monthlyRevenueRes = await db.execute(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month_key,
             COALESCE(SUM(amount), 0) as revenue
      FROM transactions
      WHERE status = 'completed' AND (description LIKE 'Payment for%' OR description LIKE 'Wallet%' OR type = 'payment')
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    `);

    // Monthly sessions count & revenue
    const monthlySessionsRes = await db.execute(sql`
      SELECT TO_CHAR(COALESCE(scheduled_at, created_at), 'YYYY-MM') as month_key,
             COUNT(*) as sessions,
             COALESCE(SUM(CASE WHEN is_paid = 1 OR status = 'completed' THEN amount ELSE 0 END), 0) as session_revenue
      FROM sessions
      WHERE COALESCE(scheduled_at, created_at) >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(COALESCE(scheduled_at, created_at), 'YYYY-MM')
    `);

    const revMap = new Map<string, number>();
    for (const r of monthlyRevenueRes.rows as any[]) {
      revMap.set(r.month_key, Number(r.revenue || 0));
    }

    const sessMap = new Map<string, { sessions: number; sessionRev: number }>();
    for (const r of monthlySessionsRes.rows as any[]) {
      sessMap.set(r.month_key, {
        sessions: Number(r.sessions || 0),
        sessionRev: Number(r.session_revenue || 0),
      });
    }

    const chartData = chartMonths.map(m => {
      const txRev = revMap.get(m.key) || 0;
      const sessInfo = sessMap.get(m.key);
      const sessCount = sessInfo?.sessions || 0;
      const sRev = sessInfo?.sessionRev || 0;
      return {
        month: m.month,
        revenue: Math.max(txRev, sRev),
        sessions: sessCount,
      };
    });

    const recentUsers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
      avatarUrl: usersTable.avatarUrl,
    }).from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`).limit(10);

    const roleBreakdown = [
      { role: "student", count: Number(totalStudents) },
      { role: "tutor", count: Number(totalTutors) },
      { role: "investor", count: Math.max(0, Number(totalUsers) - Number(totalStudents) - Number(totalTutors)) },
    ];

    res.json({
      totalUsers: Number(totalUsers),
      totalStudents: Number(totalStudents),
      totalTutors: Number(totalTutors),
      totalSessions: Number(totalSessions),
      totalRevenue,
      recentUsers,
      roleBreakdown,
      chartData,
    });
  } catch (err) {
    req.log.error({ err }, "failed to fetch admin stats");
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// GET /admin/security-logs - Strictly Admin only
router.get("/security-logs", requireAdmin, async (req, res) => {
  try {
    await initSecurityTable();
    const result = await db.execute(sql`
      SELECT id, event_type as "eventType", severity, ip_address as "ipAddress", user_agent as "userAgent", email, details, created_at as "createdAt"
      FROM security_audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ logs: result.rows });
  } catch (err) {
    req.log.error({ err }, "failed to fetch security logs");
    res.status(500).json({ error: "Failed to fetch security audit logs" });
  }
});

// GET /admin/recipient-stats - Strictly Admin only
router.get("/recipient-stats", requireAdmin, async (_req, res) => {
  try {
    const [studentsActive] = await db.select({ total: count() }).from(usersTable).where(and(eq(usersTable.role, "student"), eq(usersTable.status, "active")));
    const [tutorsActive] = await db.select({ total: count() }).from(usersTable).where(and(eq(usersTable.role, "tutor"), eq(usersTable.status, "active")));
    const [investorsActive] = await db.select({ total: count() }).from(usersTable).where(and(eq(usersTable.role, "investor"), eq(usersTable.status, "active")));
    const [allActive] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.status, "active"));
    const [allTotal] = await db.select({ total: count() }).from(usersTable);

    res.json({
      activeStudents: Number(studentsActive?.total || 0),
      activeTutors: Number(tutorsActive?.total || 0),
      activeInvestors: Number(investorsActive?.total || 0),
      activeAll: Number(allActive?.total || 0),
      total: Number(allTotal?.total || 0),
    });
  } catch (err) {
    console.error("recipient-stats error:", err);
    res.status(500).json({ error: "Failed to fetch recipient stats" });
  }
});

// GET /admin/email-queue-status - Fetch queue status & auto-drain if ready
router.get("/email-queue-status", requireAdmin, async (_req, res) => {
  try {
    const status = await getEmailQueueStatus();

    // Auto-drain check: If emails are pending and it's time for the next batch, trigger it in background
    if (status.pending > 0 && status.nextRunInMinutes === 0) {
      processEmailQueue(85).catch(e => console.error("Auto background queue error:", e));
    }

    res.json(status);
  } catch (err) {
    console.error("email-queue-status error:", err);
    res.status(500).json({ error: "Failed to fetch email queue status" });
  }
});

// POST /admin/process-email-queue - Manually trigger queue worker
router.post("/process-email-queue", requireAdmin, async (_req, res) => {
  try {
    const result = await processEmailQueue(85);
    res.json(result);
  } catch (err) {
    console.error("process-email-queue error:", err);
    res.status(500).json({ error: "Failed to process email queue" });
  }
});

// POST /admin/send-email -- send a message to one user or target audience with automated hourly queueing
router.post("/send-email", requireAdmin, async (req: any, res) => {
  try {
    const {
      recipientType, // "single" | "students" | "tutors" | "investors" | "all"
      userId,
      subject,
      message,
      mediaUrl,
      mediaType,
      activeOnly = true,
      sendInAppNotification = true,
    } = req.body;

    if (!subject || !message) {
      res.status(400).json({ error: "Subject and message are required" });
      return;
    }

    if (recipientType === "single") {
      if (!userId) {
        res.status(400).json({ error: "userId is required for a single recipient" });
        return;
      }
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId))).limit(1);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // 1. Deliver in-app notification
      if (sendInAppNotification) {
        await pushNotification(user.id, "admin_announcement", subject, message, mediaUrl || undefined);
      }

      // 2. Deliver email
      const result = await sendCustomEmail(user.email, subject, message, mediaUrl, mediaType);
      res.json({
        sent: result.ok ? 1 : 0,
        failed: result.ok ? 0 : 1,
        quotaHit: !!result.quotaExceeded,
        inAppDelivered: sendInAppNotification ? 1 : 0,
        error: result.error,
        message: result.ok ? "Message delivered successfully" : (result.error || "Failed to deliver email"),
      });
      return;
    }

    // Build filter for audience
    const conditions = [];
    if (recipientType === "students") {
      conditions.push(eq(usersTable.role, "student"));
    } else if (recipientType === "tutors") {
      conditions.push(eq(usersTable.role, "tutor"));
    } else if (recipientType === "investors") {
      conditions.push(eq(usersTable.role, "investor"));
    }
    // "all" doesn't filter role

    if (activeOnly) {
      conditions.push(eq(usersTable.status, "active"));
    }

    const whereClause = conditions.length > 1
      ? and(...conditions)
      : conditions.length === 1
      ? conditions[0]
      : undefined;

    const matchedUsers = await (whereClause
      ? db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name }).from(usersTable).where(whereClause).orderBy(usersTable.id)
      : db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name }).from(usersTable).orderBy(usersTable.id));

    // Deduplicate emails & validate format
    const seenEmails = new Set<string>();
    const uniqueUsers: typeof matchedUsers = [];
    for (const u of matchedUsers) {
      const email = u.email?.trim().toLowerCase();
      if (email && email.includes("@") && !seenEmails.has(email)) {
        seenEmails.add(email);
        uniqueUsers.push(u);
      }
    }

    const totalTargeted = uniqueUsers.length;

    // 1. In-App Notifications: guaranteed 100% reach on Student/User Dashboards
    let inAppDelivered = 0;
    if (sendInAppNotification && uniqueUsers.length > 0) {
      try {
        const notifBatchSize = 100;
        for (let i = 0; i < uniqueUsers.length; i += notifBatchSize) {
          const slice = uniqueUsers.slice(i, i + notifBatchSize);
          await db.insert(notificationsTable).values(
            slice.map(u => ({
              userId: u.id,
              type: "admin_announcement",
              title: subject,
              message: message,
              link: mediaUrl || null,
            }))
          );
        }
        inAppDelivered = uniqueUsers.length;
      } catch (notifErr) {
        console.error("Failed to insert in-app notifications:", notifErr);
      }
    }

    // 2. Enqueue all recipients into our persistent broadcast queue
    const broadcastId = `bc_${Date.now()}`;
    await enqueueBroadcast({
      broadcastId,
      subject,
      message,
      mediaUrl,
      mediaType,
      recipients: uniqueUsers,
    });

    // 3. Immediately dispatch the first batch (up to 85)
    const queueRun = await processEmailQueue(85);

    let feedbackMessage = "";
    if (queueRun.remaining > 0) {
      feedbackMessage = `Batch 1 sent (${queueRun.sent} emails). Remaining ${queueRun.remaining} queued to automatically send 85 every hour until 100% complete! (All ${inAppDelivered} students also received in-app notifications).`;
    } else {
      feedbackMessage = `All ${queueRun.sent} emails delivered successfully (plus ${inAppDelivered} dashboard notifications)!`;
    }

    res.json({
      sent: queueRun.sent,
      failed: queueRun.failed,
      totalTargeted,
      inAppDelivered,
      remaining: queueRun.remaining,
      quotaHit: queueRun.quotaHit,
      waiting: queueRun.waiting,
      message: feedbackMessage,
    });
  } catch (err) {
    console.error("send-email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
