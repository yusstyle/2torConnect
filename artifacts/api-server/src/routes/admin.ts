import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { sendCustomEmail } from "../lib/email";
import { requireAdmin } from "../lib/auth-middleware";
import { initSecurityTable } from "../lib/security";
import { pushNotification } from "./notifications";

const router: IRouter = Router();

// GET /admin/stats - strictly protected: Admin access only
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [{ total: totalUsers }] = await db.select({ total: count() }).from(usersTable);
    const [{ total: totalStudents }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "student"));
    const [{ total: totalTutors }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "tutor"));
    const [{ total: totalSessions }] = await db.select({ total: count() }).from(sessionsTable);

    const revenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total_revenue
      FROM transactions
      WHERE status = 'completed'
    `);
    const totalRevenue = Number(revenueResult.rows[0]?.total_revenue ?? 0);

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
      chartData: [],
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

// POST /admin/send-email -- send a message to one user or target audience
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
      batchSize = 85,
      offset = 0,
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

    // 2. Email Dispatch with Safe Slicing
    const startIdx = Math.max(0, Number(offset) || 0);
    const limitNum = Math.min(100, Math.max(1, Number(batchSize) || 85));
    const emailRecipients = uniqueUsers.slice(startIdx, startIdx + limitNum);

    let sent = 0;
    let failed = 0;
    let quotaHit = false;

    // Micro-batch of 5 with 150ms pause to prevent connection flooding on Mailhostbox
    const CHUNK = 5;
    for (let i = 0; i < emailRecipients.length; i += CHUNK) {
      const chunk = emailRecipients.slice(i, i + CHUNK);
      const results = await Promise.all(
        chunk.map(u => sendCustomEmail(u.email, subject, message, mediaUrl, mediaType))
      );

      for (const r of results) {
        if (r.ok) {
          sent++;
        } else {
          failed++;
          if (r.quotaExceeded) {
            quotaHit = true;
          }
        }
      }

      if (quotaHit) {
        // Stop hammering SMTP immediately to protect mailbox reputation
        break;
      }

      if (i + CHUNK < emailRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    const nextOffset = startIdx + sent;
    const remaining = Math.max(0, totalTargeted - nextOffset);

    let feedbackMessage = "";
    if (quotaHit) {
      feedbackMessage = `Delivered ${sent} emails. Mailhostbox hourly sending quota (100/hr) reached. All ${inAppDelivered} recipients received this in their dashboard notification bell! You can send to the remaining ${remaining} in 1 hour (starting at #${nextOffset + 1}).`;
    } else if (remaining > 0) {
      feedbackMessage = `Delivered ${sent} emails to safe batch (#${startIdx + 1} to #${nextOffset}). All ${inAppDelivered} users received in-app dashboard notifications. ${remaining} remaining for the next batch.`;
    } else {
      feedbackMessage = `Delivered to all ${sent} recipients successfully (plus ${inAppDelivered} dashboard notifications)!`;
    }

    res.json({
      sent,
      failed,
      totalTargeted,
      inAppDelivered,
      quotaHit,
      offset: startIdx,
      nextOffset,
      remaining,
      message: feedbackMessage,
    });
  } catch (err) {
    console.error("send-email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
