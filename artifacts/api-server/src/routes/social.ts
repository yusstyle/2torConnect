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
import { put } from "@vercel/blob";

// Vercel's serverless functions have a read-only filesystem apart from /tmp,
// and /tmp is wiped between invocations, so writing to disk with multer.diskStorage
// silently "succeeds" but the file is gone by the time it's requested.
// We now buffer the upload in memory and push it to Vercel Blob storage instead.
// Locally (no BLOB_READ_WRITE_TOKEN set) we fall back to writing to ./uploads/social
// so development keeps working without needing a Blob store.
const socialUploadDir = path.join(process.cwd(), "uploads", "social");
const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;
if (!useBlobStorage && !fs.existsSync(socialUploadDir)) fs.mkdirSync(socialUploadDir, { recursive: true });

const uploadSocialMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
}).single("file");

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