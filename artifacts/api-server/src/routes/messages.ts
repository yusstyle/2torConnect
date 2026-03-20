import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable, usersTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";
import { SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

function getCurrentUserId(req: any): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
    return payload.id;
  } catch {
    return null;
  }
}

router.get("/conversations", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const msgs = await db
      .select()
      .from(messagesTable)
      .where(or(
        eq(messagesTable.senderId, currentUserId),
        eq(messagesTable.receiverId, currentUserId)
      ))
      .orderBy(messagesTable.createdAt);

    const conversationMap = new Map<number, any>();
    for (const msg of msgs) {
      const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      const existing = conversationMap.get(otherId);
      if (!existing || msg.createdAt > existing.lastMessageAt) {
        const unread = msgs.filter(m => m.receiverId === currentUserId && m.senderId === otherId && !m.isRead).length;
        conversationMap.set(otherId, {
          userId: otherId,
          userName: "Loading...",
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: unread,
        });
      }
    }

    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async conv => {
        const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, conv.userId)).limit(1);
        return { ...conv, userName: user?.name ?? "Unknown" };
      })
    );

    res.json({ conversations });
  } catch (err) {
    req.log.error({ err }, "list conversations error");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.get("/", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const otherUserId = Number(req.query.otherUserId);
    if (!otherUserId) {
      res.status(400).json({ error: "otherUserId is required" });
      return;
    }

    const msgs = await db
      .select({ message: messagesTable, senderName: usersTable.name })
      .from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(or(
        and(eq(messagesTable.senderId, currentUserId), eq(messagesTable.receiverId, otherUserId)),
        and(eq(messagesTable.senderId, otherUserId), eq(messagesTable.receiverId, currentUserId))
      ))
      .orderBy(messagesTable.createdAt);

    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(and(eq(messagesTable.senderId, otherUserId), eq(messagesTable.receiverId, currentUserId)));

    res.json({
      messages: msgs.map(r => ({ ...r.message, senderName: r.senderName })),
    });
  } catch (err) {
    req.log.error({ err }, "list messages error");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const body = SendMessageBody.parse(req.body);
    const [message] = await db.insert(messagesTable).values({
      senderId: currentUserId,
      receiverId: body.receiverId,
      content: body.content,
    }).returning();
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);
    res.status(201).json({ ...message, senderName: user?.name });
  } catch (err) {
    req.log.error({ err }, "send message error");
    res.status(400).json({ error: "Failed to send message", message: String(err) });
  }
});

export default router;
