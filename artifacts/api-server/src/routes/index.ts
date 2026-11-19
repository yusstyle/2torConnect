import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import tutorsRouter from "./tutors";
import sessionsRouter from "./sessions";
import transactionsRouter from "./transactions";
import messagesRouter from "./messages";
import adminRouter from "./admin";
import materialsRouter from "./materials";
import socialRouter from "./social";
import universitiesRouter from "./universities";
import statsRouter from "./stats";
import superadminRouter from "./superadmin";
import sponsorshipRouter from "./sponsorship";
import walletRouter from "./wallet";
import aiRouter from "./ai";
import notificationsRouter from "./notifications";
import reviewsRouter from "./reviews";
import assignmentsRouter from "./assignments";
import leaderboardRouter from "./leaderboard";
import referralsRouter from "./referrals";
import groupsRouter from "./groups";
import pastQuestionsRouter from "./past-questions";
import { processEmailQueue } from "../lib/email-queue";
import { requireAdmin } from "../lib/auth-middleware";
import { timingSafeEqual } from "node:crypto";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stats", statsRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/tutors", tutorsRouter);
router.use("/sessions", sessionsRouter);
router.use("/transactions", transactionsRouter);
router.use("/messages", messagesRouter);
router.use("/admin", adminRouter);
router.use("/materials", materialsRouter);
router.use("/social", socialRouter);
router.use("/universities", universitiesRouter);
router.use("/superadmin", superadminRouter);
router.use("/sponsorship-requests", sponsorshipRouter);
router.use("/wallet", walletRouter);
router.use("/ai", aiRouter);
router.use("/notifications", notificationsRouter);
router.use("/reviews", reviewsRouter);
router.use("/assignments", assignmentsRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/referrals", referralsRouter);
router.use("/groups", groupsRouter);
router.use("/past-questions", pastQuestionsRouter);

// Vercel Cron can authenticate with CRON_SECRET. Admins can also trigger the
// worker manually when the deployment has no cron secret configured.
router.get("/cron/process-email-queue", (req, res, next) => {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = req.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (configuredSecret && suppliedSecret) {
    const expected = Buffer.from(configuredSecret);
    const supplied = Buffer.from(suppliedSecret);
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) {
      next();
      return;
    }
  }

  requireAdmin(req, res, () => next());
}, async (_req, res) => {
  try {
    const result = await processEmailQueue(85);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: "Failed to process email queue" });
  }
});

export default router;
