import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, sessionParticipantsTable, usersTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { pushNotification } from "./notifications";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

// 1. List active group sessions with accepted participant count
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: sessionsTable.id,
        subject: sessionsTable.subject,
        scheduledAt: sessionsTable.scheduledAt,
        durationMinutes: sessionsTable.durationMinutes,
        maxStudents: sessionsTable.maxStudents,
        notes: sessionsTable.notes,
        tutorId: sessionsTable.tutorId,
        tutorName: usersTable.name,
        tutorUsername: usersTable.username,
        tutorAvatar: usersTable.avatarUrl,
        amount: sessionsTable.amount,
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.tutorId, usersTable.id))
      .where(and(eq(sessionsTable.isGroupSession, true), eq(sessionsTable.status, "confirmed")))
      .orderBy(sessionsTable.scheduledAt)
      .limit(50);

    const enriched = await Promise.all(
      rows.map(async (s) => {
        const [{ value: joined }] = await db
          .select({ value: count() })
          .from(sessionParticipantsTable)
          .where(
            and(
              eq(sessionParticipantsTable.sessionId, s.id),
              eq(sessionParticipantsTable.status, "accepted")
            )
          );
        return { ...s, joinedCount: Number(joined) };
      })
    );

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch group sessions" });
  }
});

// 2. Student gets their pending group invitations
router.get("/my-invitations", requireAuth, async (req, res) => {
  try {
    const studentId = Number((req as any).user?.id);
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await db
      .select({
        participantId: sessionParticipantsTable.id,
        status: sessionParticipantsTable.status,
        invitedAt: sessionParticipantsTable.joinedAt,
        sessionId: sessionsTable.id,
        subject: sessionsTable.subject,
        scheduledAt: sessionsTable.scheduledAt,
        durationMinutes: sessionsTable.durationMinutes,
        maxStudents: sessionsTable.maxStudents,
        notes: sessionsTable.notes,
        amount: sessionsTable.amount,
        tutorId: sessionsTable.tutorId,
        tutorName: usersTable.name,
        tutorAvatar: usersTable.avatarUrl,
        tutorUsername: usersTable.username,
      })
      .from(sessionParticipantsTable)
      .innerJoin(sessionsTable, eq(sessionParticipantsTable.sessionId, sessionsTable.id))
      .innerJoin(usersTable, eq(sessionsTable.tutorId, usersTable.id))
      .where(
        and(
          eq(sessionParticipantsTable.studentId, studentId),
          eq(sessionParticipantsTable.status, "pending"),
          eq(sessionsTable.status, "confirmed")
        )
      )
      .orderBy(sessionsTable.scheduledAt);

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// 3. Tutor creates group session (with optional initial invited usernames)
router.post("/", requireAuth, async (req, res) => {
  try {
    const tutorId = Number((req as any).user?.id);
    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });
    const { subject, scheduledAt, durationMinutes, maxStudents, notes, amount, inviteUsernames } = req.body;
    if (!subject || !scheduledAt || !maxStudents) {
      return res.status(400).json({ error: "subject, scheduledAt, maxStudents required" });
    }

    const [tutorUser] = await db
      .select({ name: usersTable.name, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, tutorId));

    const [session] = await db
      .insert(sessionsTable)
      .values({
        tutorId,
        studentId: tutorId,
        subject,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes ?? 60,
        isGroupSession: true,
        maxStudents: Number(maxStudents),
        status: "confirmed",
        notes: notes ?? null,
        amount: amount ? String(amount) : null,
      })
      .returning();

    // If inviteUsernames provided, invite each valid student
    const invitedList: string[] = [];
    if (Array.isArray(inviteUsernames) && inviteUsernames.length > 0) {
      for (const rawUsername of inviteUsernames) {
        const clean = String(rawUsername).trim().replace(/^@+/, "");
        if (!clean) continue;

        const [targetUser] = await db
          .select({ id: usersTable.id, name: usersTable.name, username: usersTable.username })
          .from(usersTable)
          .where(sql`lower(${usersTable.username}) = lower(${clean})`)
          .limit(1);

        if (targetUser && targetUser.id !== tutorId) {
          await db
            .insert(sessionParticipantsTable)
            .values({
              sessionId: session.id,
              studentId: targetUser.id,
              status: "pending",
            })
            .onConflictDoNothing?.();

          await pushNotification(
            targetUser.id,
            "group",
            "Group Session Invitation",
            `Tutor ${tutorUser?.name ?? "A tutor"} invited you to join the group session: ${subject}`,
            "/group-sessions"
          );
          invitedList.push(targetUser.username ?? clean);
        }
      }
    }

    return res.status(201).json({ ...session, invitedUsernames: invitedList });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create group session" });
  }
});

// 4. Tutor invites student by username only
router.post("/:id/invite", requireAuth, async (req, res) => {
  try {
    const tutorId = Number((req as any).user?.id);
    const sessionId = Number(req.params.id);
    const { username } = req.body;

    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    const cleanUsername = username.trim().replace(/^@+/, "");
    if (!cleanUsername) {
      return res.status(400).json({ error: "Please enter a valid username" });
    }

    // Check session exists & caller is tutor
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.isGroupSession) return res.status(400).json({ error: "Not a group session" });
    if (session.tutorId !== tutorId) {
      return res.status(403).json({ error: "Only the session host tutor can invite students" });
    }

    // Look up student by username (case-insensitive)
    const [targetUser] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        username: usersTable.username,
        avatarUrl: usersTable.avatarUrl,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(sql`lower(${usersTable.username}) = lower(${cleanUsername})`)
      .limit(1);

    if (!targetUser) {
      return res.status(404).json({
        error: `User "@${cleanUsername}" was not found. Please verify the username.`,
      });
    }

    if (targetUser.id === tutorId) {
      return res.status(400).json({ error: "You cannot invite yourself to your own session" });
    }

    // Check existing participant record
    const [existing] = await db
      .select()
      .from(sessionParticipantsTable)
      .where(
        and(
          eq(sessionParticipantsTable.sessionId, sessionId),
          eq(sessionParticipantsTable.studentId, targetUser.id)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: `@${cleanUsername} is already a confirmed participant in this session.` });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ error: `An invitation is already pending for @${cleanUsername}.` });
      }
      // If declined previously, reset to pending
      await db
        .update(sessionParticipantsTable)
        .set({ status: "pending", joinedAt: new Date() })
        .where(eq(sessionParticipantsTable.id, existing.id));
    } else {
      await db.insert(sessionParticipantsTable).values({
        sessionId,
        studentId: targetUser.id,
        status: "pending",
      });
    }

    const [tutorUser] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, tutorId));

    await pushNotification(
      targetUser.id,
      "group",
      "Group Session Invitation",
      `Tutor ${tutorUser?.name ?? "A tutor"} invited you to join the group session: ${session.subject}`,
      "/group-sessions"
    );

    return res.json({
      success: true,
      message: `Invitation successfully sent to @${targetUser.username ?? cleanUsername}!`,
      participant: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username ?? cleanUsername,
        avatarUrl: targetUser.avatarUrl,
        status: "pending",
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to invite user" });
  }
});

// 5. Student responds (Approve or Decline) to an invitation
router.post("/:id/respond", requireAuth, async (req, res) => {
  try {
    const studentId = Number((req as any).user?.id);
    const sessionId = Number(req.params.id);
    const { action } = req.body;

    if (!studentId) return res.status(401).json({ error: "Unauthorized" });
    if (!action || !["approve", "decline"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'decline'" });
    }

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const [participant] = await db
      .select()
      .from(sessionParticipantsTable)
      .where(
        and(
          eq(sessionParticipantsTable.sessionId, sessionId),
          eq(sessionParticipantsTable.studentId, studentId)
        )
      )
      .limit(1);

    if (!participant) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const [studentUser] = await db
      .select({ name: usersTable.name, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, studentId));

    if (action === "approve") {
      // Check session capacity among accepted members
      const [{ value: joined }] = await db
        .select({ value: count() })
        .from(sessionParticipantsTable)
        .where(
          and(
            eq(sessionParticipantsTable.sessionId, sessionId),
            eq(sessionParticipantsTable.status, "accepted")
          )
        );

      if (Number(joined) >= session.maxStudents) {
        return res.status(400).json({ error: "Sorry, this group session is already full." });
      }

      await db
        .update(sessionParticipantsTable)
        .set({ status: "accepted", joinedAt: new Date() })
        .where(eq(sessionParticipantsTable.id, participant.id));

      await pushNotification(
        session.tutorId,
        "group",
        "Invitation Approved",
        `${studentUser?.name ?? "A student"} (@${studentUser?.username ?? "student"}) approved your invitation to: ${session.subject}`,
        `/session/${sessionId}`
      );

      return res.json({
        success: true,
        status: "accepted",
        sessionId,
        roomId: `2torconnect-session-${sessionId}`,
        message: "Invitation approved! You have joined the group session.",
      });
    } else {
      // Decline
      await db
        .update(sessionParticipantsTable)
        .set({ status: "declined" })
        .where(eq(sessionParticipantsTable.id, participant.id));

      await pushNotification(
        session.tutorId,
        "group",
        "Invitation Declined",
        `${studentUser?.name ?? "A student"} (@${studentUser?.username ?? "student"}) declined the invitation to: ${session.subject}`,
        "/group-sessions"
      );

      return res.json({
        success: true,
        status: "declined",
        message: "Invitation declined.",
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to respond to invitation" });
  }
});

// 6. Direct join (public join button)
router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const studentId = Number((req as any).user?.id);
    const sessionId = Number(req.params.id);
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.isGroupSession) return res.status(400).json({ error: "Not a group session" });

    const [{ value: joined }] = await db
      .select({ value: count() })
      .from(sessionParticipantsTable)
      .where(
        and(
          eq(sessionParticipantsTable.sessionId, sessionId),
          eq(sessionParticipantsTable.status, "accepted")
        )
      );

    if (Number(joined) >= session.maxStudents) {
      return res.status(400).json({ error: "Session is full" });
    }

    const [existing] = await db
      .select()
      .from(sessionParticipantsTable)
      .where(
        and(
          eq(sessionParticipantsTable.sessionId, sessionId),
          eq(sessionParticipantsTable.studentId, studentId)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "Already joined" });
      }
      // If pending or declined, update to accepted
      await db
        .update(sessionParticipantsTable)
        .set({ status: "accepted", joinedAt: new Date() })
        .where(eq(sessionParticipantsTable.id, existing.id));
    } else {
      await db.insert(sessionParticipantsTable).values({ sessionId, studentId, status: "accepted" });
    }

    const [student] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, studentId));

    await pushNotification(
      session.tutorId,
      "group",
      "Student Joined Group Session",
      `${student?.name ?? "A student"} joined your group session: ${session.subject}`,
      `/session/${sessionId}`
    );

    return res.json({ success: true, sessionId, roomId: `2torconnect-session-${sessionId}` });
  } catch (err) {
    return res.status(500).json({ error: "Failed to join group session" });
  }
});

// 7. Get participants of a group session (with username and status)
router.get("/:id/participants", requireAuth, async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const rows = await db
      .select({
        id: sessionParticipantsTable.id,
        studentId: sessionParticipantsTable.studentId,
        status: sessionParticipantsTable.status,
        joinedAt: sessionParticipantsTable.joinedAt,
        name: usersTable.name,
        username: usersTable.username,
        avatarUrl: usersTable.avatarUrl,
      })
      .from(sessionParticipantsTable)
      .innerJoin(usersTable, eq(sessionParticipantsTable.studentId, usersTable.id))
      .where(eq(sessionParticipantsTable.sessionId, sessionId))
      .orderBy(sessionParticipantsTable.joinedAt);

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch participants" });
  }
});

// 8. Tutor removes participant or cancels pending invitation
router.delete("/:id/participants/:studentId", requireAuth, async (req, res) => {
  try {
    const tutorId = Number((req as any).user?.id);
    const sessionId = Number(req.params.id);
    const studentId = Number(req.params.studentId);

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.tutorId !== tutorId) {
      return res.status(403).json({ error: "Only the session tutor can remove participants" });
    }

    await db
      .delete(sessionParticipantsTable)
      .where(
        and(
          eq(sessionParticipantsTable.sessionId, sessionId),
          eq(sessionParticipantsTable.studentId, studentId)
        )
      );

    return res.json({ success: true, message: "Participant removed" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to remove participant" });
  }
});

export default router;
