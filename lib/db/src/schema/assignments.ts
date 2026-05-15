import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const assignmentStatusEnum = pgEnum("assignment_status", ["open", "answered", "closed"]);

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  deadline: timestamp("deadline"),
  status: assignmentStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignmentResponsesTable = pgTable("assignment_responses", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignmentsTable.id, { onDelete: "cascade" }),
  tutorId: integer("tutor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Assignment = typeof assignmentsTable.$inferSelect;
export type AssignmentResponse = typeof assignmentResponsesTable.$inferSelect;
