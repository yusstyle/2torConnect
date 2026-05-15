import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralStatusEnum = pgEnum("referral_status", ["pending", "credited"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  referredId: integer("referred_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: referralStatusEnum("status").notNull().default("credited"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referralsTable.$inferSelect;
