import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tutorsTable = pgTable("tutors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  university: text("university"),
  faculty: text("faculty"),
  department: text("department"),
  level: text("level"),
  aboutYou: text("about_you"),
  subjects: text("subjects").array(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  totalSessions: integer("total_sessions").default(0),
  isVerified: boolean("is_verified").default(false),
  cgpa: numeric("cgpa", { precision: 3, scale: 2 }),
  schoolIdUrl: text("school_id_url"),
  applicationDate: timestamp("application_date").defaultNow().notNull(),
});

export const insertTutorSchema = createInsertSchema(tutorsTable).omit({ id: true, applicationDate: true, rating: true, totalSessions: true });
export type InsertTutor = z.infer<typeof insertTutorSchema>;
export type Tutor = typeof tutorsTable.$inferSelect;
