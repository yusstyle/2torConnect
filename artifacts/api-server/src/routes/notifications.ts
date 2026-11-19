import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable, pushSubscriptionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { getVapidPublicKey, isWebPushConfigured, sendWebPushNotification } from "../lib/web-push";

const router = Router();

router.get("/push-config", (_req, res) => {
  return res.json({ enabled: isWebPushConfigured(), publicKey: getVapidPublicKey() });
});

router.post("/push-subscriptions", requireAuth, async (req: any, res) => {
  const { endpoint, keys } = req.body ?? {};
  if (!isWebPushConfigured()) return res.status(503).json({ error: "Background notifications are not configured yet" });
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
    return res.status(400).json({ error: "Invalid push subscription" });
  }
  try {
    await db.insert(pushSubscriptionsTable).values({ userId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
      .onConflictDoUpdate({ target: pushSubscriptionsTable.endpoint, set: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Could not save notification subscription" });
  }
});

router.delete("/push-subscriptions", requireAuth, async (req: any, res) => {
  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== "string") return res.status(400).json({ error: "Subscription endpoint is required" });
  await db.delete(pushSubscriptionsTable).where(and(eq(pushSubscriptionsTable.userId, req.user.id), eq(pushSubscriptionsTable.endpoint, endpoint)));
  return res.json({ success: true });
});

router.get("/", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.get("/unread-count", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
    return res.json({ count: rows.length });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get count" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    const id = Number(req.params.id);
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to mark read" });
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to mark all read" });
  }
});

export default router;

export async function pushNotification(userId: number, type: string, title: string, message: string, link?: string) {
  try {
    await db.insert(notificationsTable).values({ userId, type, title, message, link });
    void sendWebPushNotification(userId, title, message, link).catch(() => {});
  } catch {}
}
