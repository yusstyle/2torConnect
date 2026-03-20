import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  RegisterStudentBody,
  RegisterTutorBody,
  LoginBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/register/student", async (req, res) => {
  try {
    const body = RegisterStudentBody.parse(req.body);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const [user] = await db.insert(usersTable).values({
      name: body.name,
      email: body.email,
      passwordHash,
      role: "student",
      phone: body.phone ?? null,
      status: "active",
    }).returning();
    await db.insert(studentsTable).values({
      userId: user.id,
      university: body.university ?? null,
      admissionType: body.admissionType ?? null,
      jambScore: body.jambScore ?? null,
      accountPlan: "free",
    });
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "register student error");
    res.status(400).json({ error: "Registration failed", message: String(err) });
  }
});

router.post("/register/tutor", async (req, res) => {
  try {
    const body = RegisterTutorBody.parse(req.body);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const [user] = await db.insert(usersTable).values({
      name: body.name,
      email: body.email,
      passwordHash,
      role: "tutor",
      phone: body.phone ?? null,
      status: "pending",
    }).returning();
    await db.insert(tutorsTable).values({
      userId: user.id,
      university: body.university ?? null,
      faculty: body.faculty ?? null,
      department: body.department ?? null,
      level: body.level ?? null,
      aboutYou: body.aboutYou ?? null,
      subjects: body.subjects ?? null,
      isVerified: false,
    });
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "register tutor error");
    res.status(400).json({ error: "Registration failed", message: String(err) });
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = LoginBody.parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.role !== body.role) {
      res.status(401).json({ error: `This account is not a ${body.role} account` });
      return;
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "login error");
    res.status(401).json({ error: "Login failed", message: String(err) });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
