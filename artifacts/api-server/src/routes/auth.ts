import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  RegisterStudentBody,
  LoginBody,
} from "@workspace/api-zod";
import { investorsTable } from "@workspace/db";

const router: IRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads", "school-ids");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const investorUploadDir = path.join(process.cwd(), "uploads", "investor-ids");
if (!fs.existsSync(investorUploadDir)) fs.mkdirSync(investorUploadDir, { recursive: true });

const schoolIdStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `school-id-${Date.now()}${ext}`);
  },
});
const uploadSchoolId = multer({
  storage: schoolIdStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
}).single("schoolIdCard");

const investorIdStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, investorUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `investor-id-${Date.now()}${ext}`);
  },
});
const uploadInvestorId = multer({
  storage: investorIdStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
}).single("idCard");

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

router.post("/register/tutor", (req, res) => {
  uploadSchoolId(req, res, async (uploadErr) => {
    if (uploadErr) {
      res.status(400).json({ error: "File upload failed", message: uploadErr.message });
      return;
    }
    try {
      const body = req.body;

      if (!body.name || !body.email || !body.password) {
        res.status(400).json({ error: "Name, email and password are required" });
        return;
      }
      if (body.password !== body.confirmPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
      }
      if (body.cgpa && (Number(body.cgpa) < 0 || Number(body.cgpa) > 5)) {
        res.status(400).json({ error: "CGPA must be between 0 and 5" });
        return;
      }

      const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
      if (existing.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
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

      const subjects = body.subjects
        ? (typeof body.subjects === "string" ? JSON.parse(body.subjects) : body.subjects)
        : null;

      const schoolIdUrl = req.file
        ? `/uploads/school-ids/${req.file.filename}`
        : null;

      await db.insert(tutorsTable).values({
        userId: user.id,
        university: body.university ?? null,
        faculty: body.faculty ?? null,
        department: body.department ?? null,
        level: body.level ?? null,
        aboutYou: body.aboutYou ?? null,
        subjects,
        cgpa: body.cgpa ? String(Number(body.cgpa).toFixed(2)) : null,
        schoolIdUrl,
        isVerified: false,
      });

      const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin },
        token,
      });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      req.log.error({ err }, "register tutor error");
      res.status(400).json({ error: "Registration failed", message: String(err) });
    }
  });
});

router.post("/register/investor", (req, res) => {
  uploadInvestorId(req, res, async (uploadErr) => {
    if (uploadErr) { res.status(400).json({ error: "File upload failed", message: uploadErr.message }); return; }
    try {
      const body = req.body;
      if (!body.name || !body.email || !body.password) { res.status(400).json({ error: "Name, email and password are required" }); return; }
      if (body.password !== body.confirmPassword) { res.status(400).json({ error: "Passwords do not match" }); return; }
      if (!body.businessName?.trim()) { res.status(400).json({ error: "Business name is required" }); return; }

      const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
      if (existing.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ error: "Email already in use" }); return;
      }

      const passwordHash = await bcrypt.hash(body.password, 10);
      const [user] = await db.insert(usersTable).values({
        name: body.name, email: body.email, passwordHash, role: "investor",
        phone: body.phone ?? null, status: "pending",
      }).returning();

      const idCardUrl = req.file ? `/uploads/investor-ids/${req.file.filename}` : null;
      await db.insert(investorsTable).values({
        userId: user.id,
        businessName: body.businessName,
        country: body.country ?? null,
        bio: body.bio ?? null,
        websiteUrl: body.websiteUrl ?? null,
        idCardUrl,
      });

      const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, status: user.status, createdAt: user.createdAt, lastLogin: user.lastLogin },
        token,
      });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      req.log.error({ err }, "register investor error");
      res.status(400).json({ error: "Registration failed", message: String(err) });
    }
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      res.status(400).json({ error: "Email, password and role are required" }); return;
    }
    const body = { email, password, role };
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
