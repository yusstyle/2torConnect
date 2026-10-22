import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import type { Request } from "express";

export function extractClientMeta(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
  const userAgent = (req.headers["user-agent"] as string) || "unknown";
  return { ipAddress, userAgent };
}

export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter (A-Z).";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number (0-9).";
  }
  return null;
}

// --- Account Lockout Store (Anti-Credential Stuffing) ---
interface LockoutRecord {
  attempts: number;
  lockedUntil: number | null;
}
const lockoutStore = new Map<string, LockoutRecord>();

export function isAccountLocked(email: string): { locked: boolean; remainingMinutes: number } {
  const normalized = email.toLowerCase().trim();
  const record = lockoutStore.get(normalized);
  if (!record || !record.lockedUntil) return { locked: false, remainingMinutes: 0 };
  if (Date.now() > record.lockedUntil) {
    lockoutStore.delete(normalized);
    return { locked: false, remainingMinutes: 0 };
  }
  const remainingMinutes = Math.max(1, Math.ceil((record.lockedUntil - Date.now()) / (60 * 1000)));
  return { locked: true, remainingMinutes };
}

export function recordFailedLogin(email: string): { locked: boolean; remainingAttempts: number } {
  const normalized = email.toLowerCase().trim();
  const record = lockoutStore.get(normalized) || { attempts: 0, lockedUntil: null };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lockout
    lockoutStore.set(normalized, record);
    return { locked: true, remainingAttempts: 0 };
  }
  lockoutStore.set(normalized, record);
  return { locked: false, remainingAttempts: 5 - record.attempts };
}

export function recordSuccessfulLogin(email: string): void {
  const normalized = email.toLowerCase().trim();
  lockoutStore.delete(normalized);
}

// --- Security Audit Logging ---
let tableInitialized = false;

export async function initSecurityTable(): Promise<void> {
  if (tableInitialized) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS security_audit_logs (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        severity VARCHAR(32) NOT NULL DEFAULT 'info',
        ip_address VARCHAR(128),
        user_agent TEXT,
        email VARCHAR(255),
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_audit_logs(created_at DESC);
    `);
    tableInitialized = true;
  } catch (e) {
    console.warn("Security table init notice:", e);
  }
}

export async function logSecurityEvent(params: {
  eventType: "failed_login" | "successful_login" | "account_locked" | "unauthorized_probe" | "password_reset" | "admin_action";
  severity: "info" | "warning" | "critical";
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  details?: string;
}): Promise<void> {
  try {
    await initSecurityTable();
    await db.execute(sql`
      INSERT INTO security_audit_logs (event_type, severity, ip_address, user_agent, email, details)
      VALUES (${params.eventType}, ${params.severity}, ${params.ipAddress || "unknown"}, ${params.userAgent || "unknown"}, ${params.email || null}, ${params.details || null})
    `);
  } catch (err) {
    console.error("Security audit logging error:", err);
  }
}
