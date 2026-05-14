import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7), "base64").toString("utf8"));
    req.authUser = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function computeBalance(userId: number, role: string) {
  const txns = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.status, "completed")));

  if (role === "tutor") {
    const earned = txns
      .filter((t) => t.type === "payment")
      .reduce((s, t) => s + Number(t.amount), 0);
    const withdrawn = txns
      .filter((t) => t.type === "withdrawal")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { earned, withdrawn, balance: earned - withdrawn };
  } else {
    const funded = txns
      .filter((t) => t.type === "bonus")
      .reduce((s, t) => s + Number(t.amount), 0);
    const spent = txns
      .filter((t) => t.type === "payment")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { funded, spent, balance: funded - spent };
  }
}

router.get("/balance", authMiddleware, async (req: any, res) => {
  try {
    const result = await computeBalance(req.authUser.id, req.authUser.role);
    res.json(result);
  } catch (err) {
    req.log?.error({ err }, "wallet balance error");
    res.status(500).json({ error: "Failed to get wallet balance" });
  }
});

router.post("/fund", authMiddleware, async (req: any, res) => {
  try {
    const { amount } = req.body;
    const parsed = Number(amount);
    if (!amount || parsed <= 0 || isNaN(parsed)) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "bonus",
      amount: parsed.toFixed(2),
      description: `Wallet top-up of ₦${parsed.toLocaleString()}`,
      status: "completed",
    });
    const balanceInfo = await computeBalance(req.authUser.id, req.authUser.role);
    res.json({ success: true, ...balanceInfo });
  } catch (err) {
    req.log?.error({ err }, "wallet fund error");
    res.status(500).json({ error: "Failed to fund wallet" });
  }
});

router.post("/withdraw", authMiddleware, async (req: any, res) => {
  try {
    if (req.authUser.role !== "tutor") {
      res.status(403).json({ error: "Only tutors can withdraw earnings" });
      return;
    }
    const { amount, bankName, accountNumber, accountName } = req.body;
    const parsed = Number(amount);
    if (!amount || parsed <= 0 || isNaN(parsed)) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }
    if (!bankName?.trim() || !accountNumber?.trim() || !accountName?.trim()) {
      res.status(400).json({ error: "Bank name, account number, and account name are required" });
      return;
    }
    const { balance } = await computeBalance(req.authUser.id, "tutor");
    if (parsed > balance) {
      res.status(400).json({ error: `Insufficient balance. Available: ₦${balance.toLocaleString()}` });
      return;
    }
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "withdrawal",
      amount: parsed.toFixed(2),
      description: `Withdrawal to ${bankName} — ${accountName} (${accountNumber})`,
      status: "completed",
    });
    const balanceInfo = await computeBalance(req.authUser.id, "tutor");
    res.json({ success: true, ...balanceInfo });
  } catch (err) {
    req.log?.error({ err }, "wallet withdraw error");
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

export default router;
