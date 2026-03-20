import { pgTable, text, serial, integer, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionStatusEnum = pgEnum("session_status", ["pending", "confirmed", "completed", "cancelled"]);

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  tutorId: integer("tutor_id").notNull().references(() => usersTable.id),
  studentId: integer("student_id").notNull().references(() => usersTable.id),
  subject: text("subject").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: sessionStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
