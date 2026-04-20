import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  socialPostsTable, socialLikesTable, socialCommentsTable,
  socialFollowsTable, usersTable
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const socialUploadDir = path.join(process.cwd(), "uploads", "social");
if (!fs.existsSync(socialUploadDir)) fs.mkdirSync(socialUploadDir, { recursive: true });
const socialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, socialUploadDir),
  filename: (_req, file, cb) => cb(null, `social-${Date.now()}${path.extname(file.originalname)}`),
});
const uploadSocialMedia = multer({ storage: socialStorage, limits: { fileSize: 50 * 1024 * 1024 } }).single("file");

const router: IRouter = Router();

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    req.authUser = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
    next();
  } catch { res.status(401).json({ error: "Unauthorized" }); }
}

async function enrichPost(post: any, currentUserId?: number) {
  const [user] = await db.select({ name: usersTable.name, role: usersTable.role, avatarUrl: usersTable.avatarUrl })
    .from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
  let liked = false;
  if (currentUserId) {
    const [like] = await db.select().from(socialLikesTable)
      .where(and(eq(socialLikesTable.postId, post.id), eq(socialLikesTable.userId, currentUserId))).limit(1);
    liked = !!like;
  }
  return { ...post, authorName: user?.name ?? "Unknown", authorRole: user?.role ?? "student", authorAvatarUrl: user?.avatarUrl ?? null, liked };
}

router.get("/feed", authMiddleware, async (req: any, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type as string | undefined;

    let query = db.select().from(socialPostsTable);
    const posts = type
      ? await query.where(eq(socialPostsTable.type, type as any)).orderBy(desc(socialPostsTable.createdAt)).limit(limit).offset(offset)
      : await query.orderBy(desc(socialPostsTable.createdAt)).limit(limit).offset(offset);

    const enriched = await Promise.all(posts.map(p => enrichPost(p, req.authUser.id)));
    res.json({ posts: enriched, page, limit });
  } catch (err) {
    req.log.error({ err }, "feed error");
    res.status(500).json({ error: "Failed to load feed" });
  }
});

router.post("/posts", authMiddleware, async (req: any, res) => {
  try {
    const { content, mediaUrl, mediaType, type } = req.body;
    if (!content?.trim() && !mediaUrl) {
      res.status(400).json({ error: "Post must have content or media" }); return;
    }
    const [post] = await db.insert(socialPostsTable).values({
      userId: req.authUser.id,
      content: content?.trim() ?? null,
      mediaUrl: mediaUrl ?? null,
      mediaType: mediaType ?? null,
      type: type ?? "tweet",
    }).returning();
    const enriched = await enrichPost(post, req.authUser.id);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "create post error");
    res.status(400).json({ error: "Failed to create post" });
  }
});

router.delete("/posts/:id", authMiddleware, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [post] = await db.select().from(socialPostsTable).where(eq(socialPostsTable.id, id)).limit(1);
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    if (post.userId !== req.authUser.id) { res.status(403).json({ error: "Forbidden" }); return; }
    await db.delete(socialPostsTable).where(eq(socialPostsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

router.post("/posts/:id/like", authMiddleware, async (req: any, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.authUser.id;
    const [existing] = await db.select().from(socialLikesTable)
      .where(and(eq(socialLikesTable.postId, postId), eq(socialLikesTable.userId, userId))).limit(1);
    if (existing) {
      await db.delete(socialLikesTable).where(eq(socialLikesTable.id, existing.id));
      await db.update(socialPostsTable).set({ likeCount: sql`like_count - 1` }).where(eq(socialPostsTable.id, postId));
      res.json({ liked: false });
    } else {
      await db.insert(socialLikesTable).values({ postId, userId });
      await db.update(socialPostsTable).set({ likeCount: sql`like_count + 1` }).where(eq(socialPostsTable.id, postId));
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

router.get("/posts/:id/comments", authMiddleware, async (req: any, res) => {
  try {
    const postId = Number(req.params.id);
    const comments = await db.select().from(socialCommentsTable)
      .where(eq(socialCommentsTable.postId, postId)).orderBy(desc(socialCommentsTable.createdAt));
    const enriched = await Promise.all(comments.map(async c => {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
      return { ...c, authorName: user?.name ?? "Unknown" };
    }));
    res.json({ comments: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to load comments" });
  }
});

router.post("/posts/:id/comments", authMiddleware, async (req: any, res) => {
  try {
    const postId = Number(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "Comment cannot be empty" }); return; }
    const [comment] = await db.insert(socialCommentsTable).values({
      postId, userId: req.authUser.id, content: content.trim()
    }).returning();
    await db.update(socialPostsTable).set({ commentCount: sql`comment_count + 1` }).where(eq(socialPostsTable.id, postId));
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.authUser.id)).limit(1);
    res.status(201).json({ ...comment, authorName: user?.name ?? "Unknown" });
  } catch (err) {
    res.status(400).json({ error: "Failed to add comment" });
  }
});

router.post("/upload", authMiddleware, (req: any, res) => {
  uploadSocialMedia(req, res, (err) => {
    if (err) { res.status(400).json({ error: "Upload failed", message: err.message }); return; }
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    res.json({ url: `/api/uploads/social/${req.file.filename}` });
  });
});

router.post("/follow/:userId", authMiddleware, async (req: any, res) => {
  try {
    const followingId = Number(req.params.userId);
    const followerId = req.authUser.id;
    if (followerId === followingId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }
    const [existing] = await db.select().from(socialFollowsTable)
      .where(and(eq(socialFollowsTable.followerId, followerId), eq(socialFollowsTable.followingId, followingId))).limit(1);
    if (existing) {
      await db.delete(socialFollowsTable).where(eq(socialFollowsTable.id, existing.id));
      res.json({ following: false });
    } else {
      await db.insert(socialFollowsTable).values({ followerId, followingId });
      res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle follow" });
  }
});

export default router;
