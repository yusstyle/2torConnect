import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function migrate() {
  const steps = [
    { name: "referral_code column", q: `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT` },
    { name: "referral_code unique index", q: `CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique ON users(referral_code) WHERE referral_code IS NOT NULL` },
    { name: "is_group_session column", q: `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_group_session BOOLEAN NOT NULL DEFAULT false` },
    { name: "max_students column", q: `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_students INTEGER NOT NULL DEFAULT 1` },
    { name: "assignment_status enum", q: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN CREATE TYPE assignment_status AS ENUM ('open','answered','closed'); END IF; END $$` },
    { name: "referral_status enum", q: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN CREATE TYPE referral_status AS ENUM ('pending','credited'); END IF; END $$` },
    { name: "notifications table", q: `CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, link TEXT, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT NOW() NOT NULL)` },
    { name: "reviews table", q: `CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL, rating INTEGER NOT NULL, comment TEXT, created_at TIMESTAMP DEFAULT NOW() NOT NULL)` },
    { name: "assignments table", q: `CREATE TABLE IF NOT EXISTS assignments (id SERIAL PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, subject TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, deadline TIMESTAMP, status assignment_status NOT NULL DEFAULT 'open', created_at TIMESTAMP DEFAULT NOW() NOT NULL)` },
    { name: "assignment_responses table", q: `CREATE TABLE IF NOT EXISTS assignment_responses (id SERIAL PRIMARY KEY, assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE, tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, response TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL)` },
    { name: "referrals table", q: `CREATE TABLE IF NOT EXISTS referrals (id SERIAL PRIMARY KEY, referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, status referral_status NOT NULL DEFAULT 'credited', created_at TIMESTAMP DEFAULT NOW() NOT NULL)` },
    { name: "session_participants table", q: `CREATE TABLE IF NOT EXISTS session_participants (id SERIAL PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, joined_at TIMESTAMP DEFAULT NOW() NOT NULL)` },
  ];

  for (const step of steps) {
    try {
      await db.execute(sql.raw(step.q));
      console.log(`✓ ${step.name}`);
    } catch (e: any) {
      console.log(`~ ${step.name}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log("Migration complete");
  process.exit(0);
}

migrate();
