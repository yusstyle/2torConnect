import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { materialsTable, tutorsTable } from "@workspace/db";
import { eq, desc, and, ilike, SQL } from "drizzle-orm";

const router: IRouter = Router();

const UPLOADS_DIR = process.env.VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xlsx", ".xls", ".txt", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

function getAuthPayload(req: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
  } catch {
    return null;
  }
}

// List materials
router.get("/", async (req, res) => {
  try {
    const { tutorId, subject, search, limit = "50", page = "1" } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (tutorId) conditions.push(eq(materialsTable.tutorId, Number(tutorId)));
    if (subject) conditions.push(ilike(materialsTable.subject, `%${subject}%`));
    if (search) conditions.push(ilike(materialsTable.title, `%${search}%`));

    const offset = (Number(page) - 1) * Number(limit);
    const materials = await db
      .select()
      .from(materialsTable)
      .where(and(...conditions, eq(materialsTable.isPublic, true)))
      .orderBy(desc(materialsTable.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({ materials, total: materials.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to list materials" });
  }
});

// Get single material
router.get("/:id", async (req, res) => {
  try {
    const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, Number(req.params.id))).limit(1);
    if (!material) { res.status(404).json({ error: "Not found" }); return; }
    res.json(material);
  } catch {
    res.status(500).json({ error: "Failed to get material" });
  }
});

// Download material
router.get("/:id/download", async (req, res) => {
  try {
    const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, Number(req.params.id))).limit(1);
    if (!material) { res.status(404).json({ error: "Not found" }); return; }

    const filePath = path.join(UPLOADS_DIR, material.filePath);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: "File not found on server" }); return; }

    await db.update(materialsTable).set({ downloads: material.downloads + 1 }).where(eq(materialsTable.id, material.id));
    res.download(filePath, material.fileName);
  } catch {
    res.status(500).json({ error: "Download failed" });
  }
});

// Upload material (tutor only)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== "tutor") {
      res.status(403).json({ error: "Only tutors can upload materials" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const { title, description, subject } = req.body;
    if (!title || !subject) {
      res.status(400).json({ error: "Title and subject are required" });
      return;
    }

    const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.userId, payload.id)).limit(1);
    if (!tutor) {
      res.status(404).json({ error: "Tutor profile not found" });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const [material] = await db.insert(materialsTable).values({
      tutorId: tutor.id,
      uploadedBy: payload.id,
      title,
      description: description ?? null,
      subject,
      fileType: ext.replace(".", "").toUpperCase(),
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      isPublic: true,
    }).returning();

    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ error: "Upload failed", message: String(err) });
  }
});

// Delete material (tutor who uploaded it)
router.delete("/:id", async (req, res) => {
  try {
    const payload = getAuthPayload(req);
    if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, Number(req.params.id))).limit(1);
    if (!material) { res.status(404).json({ error: "Not found" }); return; }
    if (material.uploadedBy !== payload.id && payload.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const filePath = path.join(UPLOADS_DIR, material.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.delete(materialsTable).where(eq(materialsTable.id, material.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;

