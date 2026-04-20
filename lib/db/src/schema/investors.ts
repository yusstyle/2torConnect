import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investorsTable = pgTable("investors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  country: text("country"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  idCardUrl: text("id_card_url"),
  isVerified: boolean("is_verified").default(false),
  totalFunded: text("total_funded").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvestorSchema = createInsertSchema(investorsTable).omit({ id: true, createdAt: true, isVerified: true, totalFunded: true });
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investorsTable.$inferSelect;
