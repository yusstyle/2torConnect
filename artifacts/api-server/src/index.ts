import "dotenv/config";
import app, { seedAdmins, ensureDbSchema } from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

ensureDbSchema().catch((err) => {
  logger.error({ err }, "Failed to ensure DB schema at startup");
});

seedAdmins().catch((err) => {
  logger.error({ err }, "Failed to seed admins at startup");
});

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
