import "dotenv/config";
import app, { seedAdmins } from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

seedAdmins().catch((err) => {
  logger.error({ err }, "Failed to seed admins at startup");
});

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
