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

export default router;
