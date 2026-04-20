import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const postTypeEnum = pgEnum("post_type", ["tweet", "post", "reel", "video"]);

export const socialPostsTable = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  type: postTypeEnum("type").notNull().default("tweet"),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialLikesTable = pgTable("social_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPostsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialCommentsTable = pgTable("social_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPostsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialFollowsTable = pgTable("social_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SocialPost = typeof socialPostsTable.$inferSelect;
export type SocialComment = typeof socialCommentsTable.$inferSelect;
