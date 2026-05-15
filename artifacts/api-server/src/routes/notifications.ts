import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// GET /api/notifications — current user's notifications
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
    res.json({ count: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to get count" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    const id = Number(req.params.id);
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all read" });
  }
});

export default router;

// Helper to push a notification (used by other routes)
export async function pushNotification(userId: number, type: string, title: string, message: string, link?: string) {
  try {
    await db.insert(notificationsTable).values({ userId, type, title, message, link });
  } catch {}
}
