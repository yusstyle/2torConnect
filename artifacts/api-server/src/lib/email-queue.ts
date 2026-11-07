import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sendCustomEmail } from "./email";

let tableInitialized = false;

export async function initEmailQueueTable(): Promise<void> {
  if (tableInitialized) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_broadcast_queue (
        id SERIAL PRIMARY KEY,
        broadcast_id VARCHAR(64) NOT NULL,
        user_id INTEGER,
        email VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        media_url TEXT,
        media_type TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        sent_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_email_queue_status_id ON email_broadcast_queue(status, id);
      CREATE INDEX IF NOT EXISTS idx_email_queue_sent_at ON email_broadcast_queue(sent_at DESC);
    `);
    tableInitialized = true;
  } catch (err) {
    console.warn("Email queue table init notice:", err);
  }
}

export async function enqueueBroadcast(params: {
  broadcastId: string;
  subject: string;
  message: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  recipients: { id: number; email: string }[];
}): Promise<number> {
  await initEmailQueueTable();
  if (!params.recipients.length) return 0;

  // Insert in chunks of 100 to avoid SQL statement size limits
  const CHUNK = 100;
  for (let i = 0; i < params.recipients.length; i += CHUNK) {
    const chunk = params.recipients.slice(i, i + CHUNK);
    for (const r of chunk) {
      await db.execute(sql`
        INSERT INTO email_broadcast_queue (broadcast_id, user_id, email, subject, message, media_url, media_type, status)
        VALUES (
          ${params.broadcastId},
          ${r.id},
          ${r.email.trim().toLowerCase()},
          ${params.subject},
          ${params.message},
          ${params.mediaUrl || null},
          ${params.mediaType || null},
          'pending'
        )
      `);
    }
  }

  return params.recipients.length;
}

export async function processEmailQueue(batchLimit = 85): Promise<{
  processed: number;
  sent: number;
  failed: number;
  remaining: number;
  quotaHit: boolean;
  waiting: boolean;
  minutesUntilNextAllowed: number;
  message: string;
}> {
  await initEmailQueueTable();

  // 1. Check how many emails have been sent in the last 60 minutes
  const recentSentRes = await db.execute(sql`
    SELECT COUNT(*) as count, MAX(sent_at) as last_sent
    FROM email_broadcast_queue
    WHERE status = 'sent' AND sent_at > NOW() - INTERVAL '60 minutes'
  `);
  const recentSentCount = Number(recentSentRes.rows[0]?.count || 0);
  const lastSentTime = recentSentRes.rows[0]?.last_sent ? new Date(String(recentSentRes.rows[0].last_sent)).getTime() : 0;

  // Remaining quota in current 60-minute rolling window (max 85 per hour to stay safely under 100)
  const allowedThisRun = Math.max(0, 85 - recentSentCount);

  // Check total pending in queue
  const pendingCountRes = await db.execute(sql`
    SELECT COUNT(*) as count FROM email_broadcast_queue WHERE status = 'pending'
  `);
  const totalPending = Number(pendingCountRes.rows[0]?.count || 0);

  if (totalPending === 0) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: 0,
      quotaHit: false,
      waiting: false,
      minutesUntilNextAllowed: 0,
      message: "No pending emails in queue.",
    };
  }

  if (allowedThisRun <= 0) {
    const minutesSinceLastSent = Math.floor((Date.now() - lastSentTime) / 60000);
    const minutesRemaining = Math.max(1, 60 - minutesSinceLastSent);
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: totalPending,
      quotaHit: true,
      waiting: true,
      minutesUntilNextAllowed: minutesRemaining,
      message: `Hourly sending quota reached (${recentSentCount}/85 sent in the last hour). Next automatic batch will process in ~${minutesRemaining} minutes.`,
    };
  }

  const toProcessCount = Math.min(allowedThisRun, batchLimit);

  // 2. Fetch the next batch of pending emails
  const pendingRows = await db.execute(sql`
    SELECT id, email, subject, message, media_url as "mediaUrl", media_type as "mediaType"
    FROM email_broadcast_queue
    WHERE status = 'pending'
    ORDER BY id ASC
    LIMIT ${toProcessCount}
  `);

  const emailsToSend = pendingRows.rows as any[];
  if (!emailsToSend.length) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: 0,
      quotaHit: false,
      waiting: false,
      minutesUntilNextAllowed: 0,
      message: "Queue is empty.",
    };
  }

  let sent = 0;
  let failed = 0;
  let quotaHit = false;

  // Process in micro-chunks of 5 with 150ms delay
  const CHUNK = 5;
  for (let i = 0; i < emailsToSend.length; i += CHUNK) {
    const chunk = emailsToSend.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async item => {
        const res = await sendCustomEmail(item.email, item.subject, item.message, item.mediaUrl, item.mediaType);
        return { item, res };
      })
    );

    for (const { item, res } of results) {
      if (res.ok) {
        sent++;
        await db.execute(sql`
          UPDATE email_broadcast_queue
          SET status = 'sent', sent_at = NOW(), error = NULL
          WHERE id = ${item.id}
        `);
      } else {
        failed++;
        await db.execute(sql`
          UPDATE email_broadcast_queue
          SET status = 'failed', error = ${res.error || 'Failed to deliver'}
          WHERE id = ${item.id}
        `);
        if (res.quotaExceeded) {
          quotaHit = true;
        }
      }
    }

    if (quotaHit) {
      break;
    }

    if (i + CHUNK < emailsToSend.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const remainingAfter = Math.max(0, totalPending - sent);

  return {
    processed: sent + failed,
    sent,
    failed,
    remaining: remainingAfter,
    quotaHit,
    waiting: false,
    minutesUntilNextAllowed: remainingAfter > 0 ? 60 : 0,
    message: `Dispatched ${sent} emails. ${remainingAfter} remaining in queue.`,
  };
}

export async function getEmailQueueStatus(): Promise<{
  pending: number;
  sentLastHour: number;
  totalSent: number;
  totalFailed: number;
  totalQueued: number;
  activeSubject?: string;
  nextRunInMinutes: number;
}> {
  await initEmailQueueTable();

  const [counts] = (await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'sent') as total_sent,
      COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
      COUNT(*) FILTER (WHERE status = 'sent' AND sent_at > NOW() - INTERVAL '60 minutes') as sent_last_hour,
      MAX(sent_at) as last_sent_at
    FROM email_broadcast_queue
  `)).rows as any[];

  const pending = Number(counts?.pending || 0);
  const totalSent = Number(counts?.total_sent || 0);
  const totalFailed = Number(counts?.total_failed || 0);
  const sentLastHour = Number(counts?.sent_last_hour || 0);

  let nextRunInMinutes = 0;
  if (pending > 0) {
    if (sentLastHour >= 85 && counts?.last_sent_at) {
      const minutesSinceLast = Math.floor((Date.now() - new Date(counts.last_sent_at).getTime()) / 60000);
      nextRunInMinutes = Math.max(1, 60 - minutesSinceLast);
    } else {
      nextRunInMinutes = 0; // Can run now
    }
  }

  let activeSubject: string | undefined;
  if (pending > 0) {
    const subjectRow = await db.execute(sql`
      SELECT subject FROM email_broadcast_queue WHERE status = 'pending' ORDER BY id ASC LIMIT 1
    `);
    activeSubject = (subjectRow.rows[0] as any)?.subject;
  }

  return {
    pending,
    sentLastHour,
    totalSent,
    totalFailed,
    totalQueued: pending + totalSent + totalFailed,
    activeSubject,
    nextRunInMinutes,
  };
}

