import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, studentsTable, otpCodesTable } from "@workspace/db";
import { eq, and, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  RegisterStudentBody,
  LoginBody,
} from "@workspace/api-zod";
import { investorsTable } from "@workspace/db";
import { sendOtpEmail } from "../lib/email";

const router: IRouter = Router();
const SUPER_ADMIN_EMAIL = "admin2-yusstyle@gmail.com";

function serializeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status, avatarUrl: u.avatarUrl ?? null, createdAt: u.createdAt, lastLogin: u.lastLogin };
}

const uploadDir = path.join(process.cwd(), "uploads", "school-ids");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const investorUploadDir = path.join(process.cwd(), "uploads", "investor-ids");
if (!fs.existsSync(investorUploadDir)) fs.mkdirSync(investorUploadDir, { recursive: true });
const avatarUploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(avatarUploadDir)) fs.mkdirSync(avatarUploadDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarUploadDir),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${(req as any).authUser?.id ?? "unknown"}-${Date.now()}${ext}`);
  },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } }).single("avatar");

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7), "base64").toString("utf8"));
    req.authUser = payload;
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
}

router.post("/avatar", authMiddleware, (req: any, res) => {
  uploadAvatar(req, res, async (err) => {
    if (err) { res.status(400).json({ error: "Upload failed", message: err.message }); return; }
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    try {
      const avatarUrl = `/api/uploads/avatars/${req.file.filename}`;
      const [user] = await db.update(usersTable).set({ avatarUrl }).where(eq(usersTable.id, req.authUser.id)).returning();
      if (!user) { res.status(404).json({ error: "User not found" }); return; }
      res.json({ avatarUrl, user: serializeUser(user) });
    } catch (e) {
      res.status(500).json({ error: "Failed to save avatar" });
    }
  });
});

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
      country: (body as any).country ?? null,
    }).returning();
    await db.insert(studentsTable).values({
      userId: user.id,
      university: body.university ?? null,
      admissionType: body.admissionType ?? null,
      jambScore: body.jambScore ?? null,
      accountPlan: "free",
    });
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, email: user.email })).toString("base64");
    res.status(201).json({ user: serializeUser(user), token });
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
        country: body.country ?? null,
      }).returning();
      const subjects = body.subjects
        ? (typeof body.subjects === "string" ? JSON.parse(body.subjects) : body.subjects)
        : null;
      const schoolIdUrl = req.file ? `/uploads/school-ids/${req.file.filename}` : null;
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
      const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, email: user.email })).toString("base64");
      res.status(201).json({ user: serializeUser(user), token });
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
        country: body.country ?? null,
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
      const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, email: user.email })).toString("base64");
      res.status(201).json({ user: serializeUser(user), token });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      req.log.error({ err }, "register investor error");
      res.status(400).json({ error: "Registration failed", message: String(err) });
    }
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" }); return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" }); return;
    }
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, email: user.email })).toString("base64");
    res.json({ user: serializeUser(user), token });
  } catch (err) {
    req.log.error({ err }, "login error");
    res.status(401).json({ error: "Login failed", message: String(err) });
  }
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ error: "Email is required" }); return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (!user) {
      res.status(200).json({ success: true, message: "If that email is registered, an OTP has been sent." }); return;
    }

    await db.delete(otpCodesTable).where(eq(otpCodesTable.email, normalizedEmail));

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otpCodesTable).values({ email: normalizedEmail, code, expiresAt });

    const emailSent = await sendOtpEmail(normalizedEmail, code);
    const emailConfigured = !!(process.env["SMTP_USER"] && process.env["SMTP_PASS"]);

    res.json({ success: true, emailConfigured, emailSent, message: "OTP sent to your email. It expires in 10 minutes." });
  } catch (err) {
    req.log.error({ err }, "send otp error");
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email?.trim() || !code?.trim()) {
      res.status(400).json({ error: "Email and OTP code are required" }); return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    const [otpRecord] = await db.select().from(otpCodesTable)
      .where(and(
        eq(otpCodesTable.email, normalizedEmail),
        eq(otpCodesTable.code, code.trim()),
        eq(otpCodesTable.used, false)
      ))
      .limit(1);

    if (!otpRecord) {
      res.status(400).json({ error: "Invalid OTP code" }); return;
    }
    if (otpRecord.expiresAt < now) {
      res.status(400).json({ error: "OTP has expired. Please request a new one." }); return;
    }

    await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, otpRecord.id));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" }); return;
    }

    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, email: user.email })).toString("base64");
    res.json({ success: true, user: serializeUser(user), token });
  } catch (err) {
    req.log.error({ err }, "verify otp error");
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id)).limit(1);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.json(serializeUser(user));
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
