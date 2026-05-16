import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

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
  } catch {}
}
