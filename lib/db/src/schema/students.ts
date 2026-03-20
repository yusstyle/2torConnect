import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { accountPlanEnum } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  university: text("university"),
  admissionType: text("admission_type"),
  jambScore: integer("jamb_score"),
  accountPlan: accountPlanEnum("account_plan").notNull().default("free"),
  totalSessions: integer("total_sessions").default(0),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
