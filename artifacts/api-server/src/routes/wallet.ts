import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  initializePayment,
  verifyPayment,
  singleDisbursement,
  BANK_CODES,
} from "../lib/monnify";

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

// Initiate Monnify payment for wallet funding
router.post("/fund", authMiddleware, async (req: any, res) => {
  try {
    const { amount, redirectUrl } = req.body;
    const parsed = Number(amount);
    if (!amount || parsed <= 0 || isNaN(parsed)) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    const paymentReference = `2tor-fund-${req.authUser.id}-${randomUUID()}`;

    // Determine redirect URL: use provided, fallback to REPLIT_DEV_DOMAIN, then localhost
    const domain = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";
    const finalRedirectUrl = redirectUrl ?? `${domain}/student/wallet`;

    const result = await initializePayment({
      amount: parsed,
      customerName: req.authUser.name ?? "Student",
      customerEmail: req.authUser.email ?? "student@2torconnect.com",
      paymentReference,
      redirectUrl: finalRedirectUrl,
      description: `Wallet top-up of ₦${parsed.toLocaleString()}`,
    });

    // Record pending transaction
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "bonus",
      amount: parsed.toFixed(2),
      description: `Wallet top-up of ₦${parsed.toLocaleString()}`,
      reference: result.transactionReference,
      status: "pending",
    });

    res.json({
      checkoutUrl: result.checkoutUrl,
      transactionReference: result.transactionReference,
      paymentReference,
    });
  } catch (err: any) {
    req.log?.error({ err }, "wallet fund error");
    res.status(500).json({ error: err?.message ?? "Failed to initiate payment" });
  }
});

// Verify Monnify payment and credit wallet
router.post("/verify", authMiddleware, async (req: any, res: any): Promise<any> => {
  try {
    const { transactionReference } = req.body;
    if (!transactionReference) {
      return res.status(400).json({ error: "transactionReference is required" });
    }

    // Check if already verified (idempotent)
    const [existing] = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.reference, transactionReference),
          eq(transactionsTable.userId, req.authUser.id),
        )
      )
      .limit(1);

    if (existing?.status === "completed") {
      const balanceInfo = await computeBalance(req.authUser.id, req.authUser.role);
      return res.json({ success: true, alreadyVerified: true, ...balanceInfo });
    }

    const payment = await verifyPayment(transactionReference);

    if (payment.paymentStatus !== "PAID") {
      return res.status(400).json({ error: `Payment not completed. Status: ${payment.paymentStatus}` });
    }

    // Mark transaction as completed
    if (existing) {
      await db
        .update(transactionsTable)
        .set({ status: "completed" })
        .where(eq(transactionsTable.id, existing.id));
    } else {
      // No pending record found — create one (e.g., webhook arrived before verify call)
      await db.insert(transactionsTable).values({
        userId: req.authUser.id,
        type: "bonus",
        amount: payment.amountPaid.toFixed(2),
        description: `Wallet top-up via Monnify`,
        reference: transactionReference,
        status: "completed",
      });
    }

    const balanceInfo = await computeBalance(req.authUser.id, req.authUser.role);
    return res.json({ success: true, ...balanceInfo });
  } catch (err: any) {
    req.log?.error({ err }, "wallet verify error");
    res.status(500).json({ error: err?.message ?? "Failed to verify payment" });
  }
});

// Tutor withdrawal via Monnify disbursement
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

    const bankCode = BANK_CODES[bankName];
    if (!bankCode) {
      res.status(400).json({ error: `Bank "${bankName}" is not supported for payouts` });
      return;
    }

    const { balance } = await computeBalance(req.authUser.id, "tutor");
    if (parsed > balance) {
      res.status(400).json({ error: `Insufficient balance. Available: ₦${balance.toLocaleString()}` });
      return;
    }

    const reference = `2tor-withdraw-${req.authUser.id}-${randomUUID()}`;

    // Record pending withdrawal first
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "withdrawal",
      amount: parsed.toFixed(2),
      description: `Withdrawal to ${bankName} — ${accountName} (${accountNumber})`,
      reference,
      status: "pending",
    });

    try {
      await singleDisbursement({
        amount: parsed,
        reference,
        narration: `2torConnect tutor payout - ${accountName}`,
        bankCode,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });

      // Mark as completed after successful disbursement
      await db
        .update(transactionsTable)
        .set({ status: "completed" })
        .where(eq(transactionsTable.reference, reference));

      const balanceInfo = await computeBalance(req.authUser.id, "tutor");
      res.json({ success: true, ...balanceInfo });
    } catch (disbErr: any) {
      // Mark as failed if Monnify rejected it
      await db
        .update(transactionsTable)
        .set({ status: "failed" })
        .where(eq(transactionsTable.reference, reference));
      throw disbErr;
    }
  } catch (err: any) {
    req.log?.error({ err }, "wallet withdraw error");
    res.status(500).json({ error: err?.message ?? "Failed to process withdrawal" });
  }
});

// Monnify webhook — marks transactions as completed when Monnify notifies us
router.post("/webhook", async (req: any, res) => {
  try {
    const { eventType, eventData } = req.body;

    if (eventType === "SUCCESSFUL_TRANSACTION") {
      const { transactionReference, paymentStatus, amountPaid, customer } = eventData ?? {};
      if (paymentStatus === "PAID" && transactionReference) {
        await db
          .update(transactionsTable)
          .set({ status: "completed" })
          .where(eq(transactionsTable.reference, transactionReference));
      }
    }

    res.json({ success: true });
  } catch (err) {
    req.log?.error({ err }, "monnify webhook error");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
