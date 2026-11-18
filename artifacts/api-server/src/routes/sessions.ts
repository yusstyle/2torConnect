import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, transactionsTable, usersTable, tutorsTable } from "@workspace/db";
import { eq, and, count, or } from "drizzle-orm";
import { CreateSessionBody, UpdateSessionBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import {
  sendSessionConfirmedEmailToStudent,
} from "../lib/email";
import { pushNotification } from "./notifications";
import { initializePaystackPayment } from "../lib/paystack";

const router: IRouter = Router();

async function enrichSession(session: typeof sessionsTable.$inferSelect) {
  const [tutor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, session.tutorId)).limit(1);
  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, session.studentId)).limit(1);
  return {
    ...session,
    tutorName: tutor?.name ?? "Unknown",
    studentName: student?.name ?? "Unknown",
  };
}

// GET /sessions - Protected: users only see their own sessions; admins see all
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { tutorId, studentId, status } = req.query;

    const conditions = [];
    if (req.user?.role !== "admin") {
      conditions.push(or(
        eq(sessionsTable.tutorId, req.user.id),
        eq(sessionsTable.studentId, req.user.id)
      )!);
    } else {
      if (tutorId) conditions.push(eq(sessionsTable.tutorId, Number(tutorId)));
      if (studentId) conditions.push(eq(sessionsTable.studentId, Number(studentId)));
    }
    if (status) conditions.push(eq(sessionsTable.status, status as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sessions = await db.select().from(sessionsTable).where(where).limit(limit).offset(offset).orderBy(sessionsTable.scheduledAt);
    const [{ value: total }] = await db.select({ value: count() }).from(sessionsTable).where(where);

    const enriched = await Promise.all(sessions.map(enrichSession));
    res.json({ sessions: enriched, total: Number(total), page, limit });
  } catch (err) {
    req.log.error({ err }, "list sessions error");
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// POST /sessions - Protected: student books for themselves
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const body = CreateSessionBody.parse(req.body);
    if (req.user?.role !== "student") {
      res.status(403).json({ error: "Only students can book tutor sessions" });
      return;
    }
    const studentId = req.user.id;
    const [tutorProfile] = await db.select().from(tutorsTable).where(eq(tutorsTable.userId, body.tutorId)).limit(1);
    if (!tutorProfile || Number(tutorProfile.hourlyRate ?? 0) <= 0) {
      res.status(400).json({ error: "This tutor has not set a session price" });
      return;
    }

    const [session] = await db.insert(sessionsTable).values({
      tutorId: body.tutorId,
      studentId,
      subject: body.subject,
      scheduledAt: new Date(body.scheduledAt),
      durationMinutes: body.durationMinutes ?? 60,
      amount: String(tutorProfile.hourlyRate),
      notes: body.notes ?? null,
      status: "pending",
    }).returning();
    const enriched = await enrichSession(session);

    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "create session error");
    res.status(400).json({ error: "Failed to create session", message: String(err) });
  }
});

// GET /sessions/:id - Protected: only session participants or admin
router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (req.user?.role !== "admin" && req.user?.id !== session.tutorId && req.user?.id !== session.studentId) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this session" });
      return;
    }
    const enriched = await enrichSession(session);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "get session error");
    res.status(500).json({ error: "Failed to get session" });
  }
});

// PATCH /sessions/:id - Protected: only session participants or admin
router.patch("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (req.user?.role !== "admin" && req.user?.id !== session.tutorId && req.user?.id !== session.studentId) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this session" });
      return;
    }

    const body = UpdateSessionBody.parse(req.body);
    if (req.user?.role !== "admin" && req.user?.id === session.tutorId && body.status === "confirmed" && session.isPaid !== 1) {
      res.status(400).json({ error: "Student payment is required before confirming this booking" });
      return;
    }
    if (body.status === "completed") {
      if (req.user?.role !== "admin" && req.user?.id !== session.tutorId) {
        res.status(403).json({ error: "Only the tutor can complete this class" });
        return;
      }
      if (session.status !== "confirmed" || session.isPaid !== 1) {
        res.status(400).json({ error: "Only a confirmed, paid class can be completed" });
        return;
      }
      const classEnd = new Date(session.scheduledAt).getTime() + session.durationMinutes * 60_000;
      if (Date.now() < classEnd) {
        res.status(400).json({ error: "The class can be completed after its scheduled end time" });
        return;
      }
    }
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (req.body.liveUrl !== undefined) updateData.liveUrl = req.body.liveUrl;
    if (req.body.amount !== undefined) updateData.amount = req.body.amount;
    const [updated] = await db.update(sessionsTable).set(updateData).where(eq(sessionsTable.id, id)).returning();
    const enriched = await enrichSession(updated);

    // If session status was updated to confirmed, notify the student via email & in-app
    if (body.status === "confirmed" && session.status !== "confirmed") {
      try {
        const [tutorUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.tutorId)).limit(1);
        const [studentUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.studentId)).limit(1);
        if (studentUser && tutorUser) {
          sendSessionConfirmedEmailToStudent({
            studentName: studentUser.name,
            studentEmail: studentUser.email,
            tutorName: tutorUser.name,
            subject: session.subject,
            scheduledAt: session.scheduledAt,
            sessionId: session.id,
          }).catch((err) => req.log.warn({ err }, "Failed sending session confirmed email"));

          pushNotification(
            studentUser.id,
            "session_confirmed",
            `Session Confirmed! 🎉`,
            `${tutorUser.name} has confirmed your session for ${session.subject}.`,
            `/session/${session.id}`
          ).catch(() => {});
        }
      } catch (notifyErr) {
        req.log.warn({ err: notifyErr }, "Session confirmation notify warning");
      }
    }

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "update session error");
    res.status(500).json({ error: "Failed to update session" });
  }
});

// POST /sessions/:id/pay - Protected: student or admin only
router.post("/:id/pay", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (req.user?.role !== "admin" && req.user?.id !== session.studentId) {
      res.status(403).json({ error: "Forbidden: Only the student can pay for this session" });
      return;
    }
    if (session.isPaid === 1) {
      res.status(400).json({ error: "Session is already paid" });
      return;
    }

    const amount = Number(session.amount ?? "0");

    if (amount > 0) {
      const studentTxns = await db
        .select()
        .from(transactionsTable)
        .where(and(eq(transactionsTable.userId, session.studentId), eq(transactionsTable.status, "completed")));
      const funded = studentTxns.filter((t) => t.type === "bonus").reduce((s, t) => s + Number(t.amount), 0);
      const spent = studentTxns.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
      const walletBalance = funded - spent;
      if (walletBalance < amount) {
        res.status(400).json({
          error: "Insufficient wallet balance",
          message: `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than the session amount (₦${amount.toLocaleString()}). Please top up your wallet first.`,
        });
        return;
      }
    }

    await db.update(sessionsTable)
      .set({ isPaid: 1, status: "confirmed" })
      .where(eq(sessionsTable.id, id));

    await db.insert(transactionsTable).values({
      userId: session.studentId,
      sessionId: id,
      type: "payment",
      amount: String(amount),
      description: `Payment for session #${id} — ${session.subject}`,
      status: "completed",
    });

    await db.insert(transactionsTable).values({
      userId: session.tutorId,
      sessionId: id,
      type: "payment",
      amount: String(amount),
      description: `Earnings for session #${id} — ${session.subject}`,
      status: "completed",
    });

    try {
      const [tutorUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.tutorId)).limit(1);
      const [studentUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.studentId)).limit(1);
      if (studentUser && tutorUser) {
        sendSessionConfirmedEmailToStudent({
          studentName: studentUser.name,
          studentEmail: studentUser.email,
          tutorName: tutorUser.name,
          subject: session.subject,
          scheduledAt: session.scheduledAt,
          sessionId: session.id,
        }).catch(() => {});

        pushNotification(
          tutorUser.id,
          "payment_received",
          `Payment Confirmed: ${session.subject}`,
          `${studentUser.name} paid ₦${amount.toLocaleString()} for session #${id}. Session is confirmed!`,
          "/tutor/sessions"
        ).catch(() => {});
      }
    } catch {}

    const [updated] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    const enriched = await enrichSession(updated);
    res.json({ success: true, session: enriched, message: "Payment confirmed. Tutor has been notified." });
  } catch (err) {
    req.log.error({ err }, "pay session error");
    res.status(500).json({ error: "Failed to process payment", message: String(err) });
  }
});

// POST /sessions/:id/paystack-initiate - Direct Paystack checkout (Visa, Mastercard, Verve, Transfer)
router.post("/:id/paystack-initiate", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id)).limit(1);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (req.user?.role !== "admin" && (req.user?.role !== "student" || req.user?.id !== session.studentId)) {
      return res.status(403).json({ error: "Only the student who booked this session can pay" });
    }
    if (session.isPaid === 1) return res.status(400).json({ error: "Session is already paid" });

    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, session.studentId)).limit(1);
    const amount = Number(session.amount ?? "0");
    if (amount <= 0) {
      await db.update(sessionsTable).set({ isPaid: 1, status: "confirmed" }).where(eq(sessionsTable.id, id));
      return res.json({ success: true, message: "Free session confirmed" });
    }

    const host = req.get("host");
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const domain = process.env.PUBLIC_URL || (host ? `${protocol}://${host}` : "https://www.2torconnect.com");
    const ref = `2tor-sess-${id}-${Date.now()}`;

    const result = await initializePaystackPayment({
      amount,
      email: student?.email || req.user?.email || "student@2torconnect.com",
      reference: ref,
      callbackUrl: `${domain}/student/sessions?sessionPaid=${id}&reference=${ref}`,
      description: `Payment for session #${id}: ${session.subject}`,
      metadata: {
        type: "session_booking_payment",
        sessionId: id,
        studentId: session.studentId,
        tutorId: session.tutorId,
      },
    });

    return res.json({
      checkoutUrl: result.authorizationUrl,
      reference: result.reference,
      accessCode: result.accessCode,
    });
  } catch (err: any) {
    req.log?.error({ err }, "paystack initiate session error");
    return res.status(500).json({ error: err.message || "Failed to initiate payment" });
  }
});

export default router;
