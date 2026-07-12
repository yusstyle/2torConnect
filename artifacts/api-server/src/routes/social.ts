import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  socialPostsTable, socialLikesTable, socialCommentsTable,
  socialFollowsTable, usersTable
} from "@workspace/db";
import { eq, desc, and, sql, count, or, ilike, inArray } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const socialUploadDir = path.join(process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads"), "social");
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
  const [user] = await db.select({
    name: usersTable.name,
    role: usersTable.role,
    avatarUrl: usersTable.avatarUrl,
    username: usersTable.username,
  }).from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);

  let liked = false;
  let isFollowing = false;

  const [{ value: followerCount }] = await db
    .select({ value: count() })
    .from(socialFollowsTable)
    .where(eq(socialFollowsTable.followingId, post.userId));

  if (currentUserId) {
    const [like] = await db.select().from(socialLikesTable)
      .where(and(eq(socialLikesTable.postId, post.id), eq(socialLikesTable.userId, currentUserId))).limit(1);
    liked = !!like;

    if (currentUserId !== post.userId) {
      const [follow] = await db.select().from(socialFollowsTable)
        .where(and(eq(socialFollowsTable.followerId, currentUserId), eq(socialFollowsTable.followingId, post.userId))).limit(1);
      isFollowing = !!follow;
    }
  }

  return {
    ...post,
    authorName: user?.name ?? "Unknown",
    authorUsername: user?.username ?? null,
    authorRole: user?.role ?? "student",
    authorAvatarUrl: user?.avatarUrl ?? null,
    liked,
    isFollowing,
    authorFollowerCount: Number(followerCount),
  };
}

// GET /feed?mode=following|all&type=tweet|post|reel|video
router.get("/feed", authMiddleware, async (req: any, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type as string | undefined;
    const mode = req.query.mode as string | undefined; // "following" or "all"
    const currentUserId = req.authUser.id;

    let postIds: number[] | null = null;

    if (mode === "following") {
      const follows = await db.select({ followingId: socialFollowsTable.followingId })
        .from(socialFollowsTable)
        .where(eq(socialFollowsTable.followerId, currentUserId));
      const followedIds = follows.map(f => f.followingId);
      // Include own posts too in following feed
      followedIds.push(currentUserId);
      postIds = followedIds;
    }

    let posts: any[];
    if (postIds !== null && postIds.length === 0) {
      posts = [];
    } else {
      const conditions: any[] = [];
      if (type) conditions.push(eq(socialPostsTable.type, type as any));
      if (postIds !== null) conditions.push(inArray(socialPostsTable.userId, postIds));

      posts = await db.select().from(socialPostsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(socialPostsTable.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const enriched = await Promise.all(posts.map(p => enrichPost(p, currentUserId)));
    res.json({ posts: enriched, page, limit });
  } catch (err) {
    req.log.error({ err }, "feed error");
    res.status(500).json({ error: "Failed to load feed" });
  }
});

// GET /search/users?q=query — search users by name or username
router.get("/search/users", authMiddleware, async (req: any, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) { res.json({ users: [] }); return; }

    const currentUserId = req.authUser.id;
    const searchTerm = q.startsWith("@") ? q.slice(1) : q;

    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      role: usersTable.role,
      avatarUrl: usersTable.avatarUrl,
      status: usersTable.status,
    }).from(usersTable).where(
      or(
        ilike(usersTable.name, `%${searchTerm}%`),
        ilike(usersTable.username, `%${searchTerm}%`),
      )
    ).limit(20);

    // Enrich with follow status
    const enriched = await Promise.all(users.map(async u => {
      let isFollowing = false;
      if (u.id !== currentUserId) {
        const [follow] = await db.select().from(socialFollowsTable)
          .where(and(
            eq(socialFollowsTable.followerId, currentUserId),
            eq(socialFollowsTable.followingId, u.id)
          )).limit(1);
        isFollowing = !!follow;
      }
      const [{ value: followerCount }] = await db.select({ value: count() })
        .from(socialFollowsTable).where(eq(socialFollowsTable.followingId, u.id));
      return { ...u, isFollowing, followerCount: Number(followerCount) };
    }));

    res.json({ users: enriched });
  } catch (err) {
    req.log.error({ err }, "user search error");
    res.status(500).json({ error: "Search failed" });
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
      const [user] = await db.select({ name: usersTable.name, username: usersTable.username }).from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
      return { ...c, authorName: user?.name ?? "Unknown", authorUsername: user?.username ?? null };
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
    const [user] = await db.select({ name: usersTable.name, username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.authUser.id)).limit(1);
    res.status(201).json({ ...comment, authorName: user?.name ?? "Unknown", authorUsername: user?.username ?? null });
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
    } else {
      await db.insert(socialFollowsTable).values({ followerId, followingId });
    }
    const [{ value: followerCount }] = await db
      .select({ value: count() })
      .from(socialFollowsTable)
      .where(eq(socialFollowsTable.followingId, followingId));
    res.json({ following: !existing, followerCount: Number(followerCount) });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle follow" });
  }
});

router.get("/users/:userId/stats", authMiddleware, async (req: any, res) => {
  try {
    const userId = Number(req.params.userId);
    const [{ value: followers }] = await db.select({ value: count() }).from(socialFollowsTable).where(eq(socialFollowsTable.followingId, userId));
    const [{ value: following }] = await db.select({ value: count() }).from(socialFollowsTable).where(eq(socialFollowsTable.followerId, userId));
    res.json({ followers: Number(followers), following: Number(following) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;

