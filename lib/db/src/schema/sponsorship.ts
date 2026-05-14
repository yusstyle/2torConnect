import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sponsorshipRequestsTable = pgTable("sponsorship_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  story: text("story").notNull(),
  amountNeeded: numeric("amount_needed", { precision: 10, scale: 2 }),
  category: text("category").notNull().default("general"),
  university: text("university"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSponsorshipRequestSchema = createInsertSchema(sponsorshipRequestsTable).omit({ id: true, createdAt: true });
export type InsertSponsorshipRequest = z.infer<typeof insertSponsorshipRequestSchema>;
export type SponsorshipRequest = typeof sponsorshipRequestsTable.$inferSelect;
