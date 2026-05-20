import { pgTable, text, serial, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["student", "tutor", "admin", "investor"]);
export const statusEnum = pgEnum("status", ["pending", "active", "suspended", "rejected"]);
export const accountPlanEnum = pgEnum("account_plan", ["free", "basic", "premium"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  phone: text("phone"),
  status: statusEnum("status").notNull().default("pending"),
  avatarUrl: text("avatar_url"),
  username: text("username").unique(),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  country: text("country"),
  referralCode: text("referral_code").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, lastLogin: true, passwordHash: true }).extend({
  password: z.string().min(6),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
