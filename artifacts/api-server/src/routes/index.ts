import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import tutorsRouter from "./tutors";
import sessionsRouter from "./sessions";
import transactionsRouter from "./transactions";
import messagesRouter from "./messages";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/tutors", tutorsRouter);
router.use("/sessions", sessionsRouter);
router.use("/transactions", transactionsRouter);
router.use("/messages", messagesRouter);
router.use("/admin", adminRouter);

export default router;
