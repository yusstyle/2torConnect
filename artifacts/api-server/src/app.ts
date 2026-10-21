import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { optionalAuth, requireAuth } from "./lib/auth-middleware";
import { globalApiRateLimiter } from "./lib/rate-limiter";

export async function seedAdmins() {
  const seedPass = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPass) return;

  const ADMIN_ACCOUNTS = [
    { email: "admin2-yusstyle@gmail.com", password: seedPass, name: "Super Admin" },
    { email: "admin@2torconnect.com", password: seedPass, name: "Admin" },
  ];

  for (const account of ADMIN_ACCOUNTS) {
    try {
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, account.email)).limit(1);
      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash(account.password, 10);
        await db.insert(usersTable).values({
          name: account.name,
          email: account.email,
          passwordHash,
          role: "admin",
          status: "active",
        });
        logger.info({ email: account.email }, "Admin account created");
      }
    } catch (err) {
      logger.error({ err, email: account.email }, "Failed to seed admin");
    }
  }
}

const app: Express = express();

// 1. Enterprise Security Headers (Defense-in-depth against MIME sniffing, clickjacking & XSS)
app.use((_req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  next();
});

// 2. HTTP Request Logger
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// 3. Strict CORS Whitelist
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/([a-zA-Z0-9-]+\.)*2torconnect\.com$/,
  /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
      if (allowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);

// 4. Input Protection: Restrict payload size to prevent memory flood denial-of-service
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// 5. Global API Rate Limiter: max 150 requests/min per IP
app.use("/api", globalApiRateLimiter);

// 6. Global verified auth middleware (HMAC-SHA256 signed JWTs)
app.use(optionalAuth);

// 7. Core Application Routes
app.use("/api", router);

// 8. Protected File Storage: Avatars are public, but ID cards require authentication
const uploadDir = path.join(process.cwd(), "uploads");
const avatarDir = path.join(uploadDir, "avatars");
const schoolIdDir = path.join(uploadDir, "school-ids");
const investorIdDir = path.join(uploadDir, "investor-ids");

app.use("/uploads/avatars", express.static(avatarDir));
app.use("/api/uploads/avatars", express.static(avatarDir));

app.use("/uploads/school-ids", requireAuth, express.static(schoolIdDir));
app.use("/api/uploads/school-ids", requireAuth, express.static(schoolIdDir));
app.use("/uploads/investor-ids", requireAuth, express.static(investorIdDir));
app.use("/api/uploads/investor-ids", requireAuth, express.static(investorIdDir));

// Fallback for general non-sensitive uploads
app.use("/uploads", express.static(uploadDir));
app.use("/api/uploads", express.static(uploadDir));

export default app;
