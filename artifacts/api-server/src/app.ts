import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_ACCOUNTS = [
  { email: "admin2-yusstyle@gmail.com", password: "098756098756098756Y", name: "Super Admin" },
  { email: "admin@2torconnect.com", password: "admin@2tor2024", name: "Admin" },
];

async function seedAdmins() {
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

seedAdmins();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global soft-auth: decode Bearer token and attach to req.user + req.authUser
app.use((req: any, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = JSON.parse(Buffer.from(authHeader.slice(7), "base64").toString("utf8"));
      req.user = payload;
      req.authUser = payload;
    } catch {
      // invalid token — routes that require auth will reject
    }
  }
  next();
});

app.use("/api", router);
const uploadDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadDir));
app.use("/api/uploads", express.static(uploadDir));

export default app;
