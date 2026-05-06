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

const SUPER_ADMIN_EMAIL = "admin2-yusstyle@gmail.com";
const SUPER_ADMIN_PASSWORD = "098756098756098756Y";
const SUPER_ADMIN_NAME = "Super Admin";

async function seedSuperAdmin() {
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, SUPER_ADMIN_EMAIL)).limit(1);
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      await db.insert(usersTable).values({
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        role: "admin",
        status: "active",
      });
      logger.info("Super admin account created");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed super admin");
  }
}

seedSuperAdmin();

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

app.use("/api", router);
const uploadDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadDir));
app.use("/api/uploads", express.static(uploadDir));

export default app;
