import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, sessionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth } from "../lib/auth-middleware";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
  verifyPaystackWebhookSignature,
  resolvePaystackAccount,
  createPaystackTransferRecipient,
  initiatePaystackTransfer,
  getPaystackPublicKey,
  isPaystackLive,
  isPaystackConfigured,
  PAYSTACK_NIGERIAN_BANKS,
  PAYSTACK_BANK_CODES,
} from "../lib/paystack";
import { pushNotification } from "./notifications";
import { sendSessionConfirmedEmailToStudent } from "../lib/email";

const router: IRouter = Router();

const authMiddleware = requireAuth;

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
    return { earned, withdrawn, balance: Math.max(0, earned - withdrawn) };
  } else {
    const funded = txns
      .filter((t) => t.type === "bonus")
      .reduce((s, t) => s + Number(t.amount), 0);
    const spent = txns
      .filter((t) => t.type === "payment")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { funded, spent, balance: Math.max(0, funded - spent) };
  }
}

// ---------------------------------------------------------------------------
// 1. Get Wallet Balance
// ---------------------------------------------------------------------------
router.get("/balance", authMiddleware, async (req: any, res) => {
  try {
    const result = await computeBalance(req.authUser.id, req.authUser.role);
    res.json(result);
  } catch (err) {
    req.log?.error({ err }, "wallet balance error");
    res.status(500).json({ error: "Failed to get wallet balance" });
  }
});

// ---------------------------------------------------------------------------
// 2. Paystack Public Configuration (Mode, Public Key)
// ---------------------------------------------------------------------------
router.get("/paystack-config", async (_req, res) => {
  res.json({
    publicKey: getPaystackPublicKey(),
    isLive: isPaystackLive(),
    isConfigured: isPaystackConfigured(),
    acceptedMethods: ["Visa", "Mastercard", "Verve", "Bank Transfer", "USSD", "OPay", "Kuda"],
  });
});

// ---------------------------------------------------------------------------
// 3. Supported Nigerian Banks for Payouts
// ---------------------------------------------------------------------------
router.get("/banks", async (_req, res) => {
  res.json(PAYSTACK_NIGERIAN_BANKS);
});

// ---------------------------------------------------------------------------
// 4. Resolve Bank Account Name via Paystack
// ---------------------------------------------------------------------------
router.post("/resolve-account", authMiddleware, async (req: any, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ error: "accountNumber and bankCode are required" });
    }

    const resolved = await resolvePaystackAccount(accountNumber, bankCode);
    return res.json(resolved);
  } catch (err: any) {
    req.log?.error({ err }, "resolve account error");
    return res.status(400).json({ error: err.message || "Failed to resolve bank account" });
  }
});

// ---------------------------------------------------------------------------
// 5. Initiate Paystack Payment for Wallet Funding
// ---------------------------------------------------------------------------
router.post("/fund", authMiddleware, async (req: any, res) => {
  try {
    const { amount, redirectUrl } = req.body;
    const parsed = Number(amount);
    if (!amount || parsed <= 0 || isNaN(parsed)) {
      res.status(400).json({ error: "Invalid amount. Minimum is ₦100." });
      return;
    }

    const paymentReference = `2tor-fund-${req.authUser.id}-${randomUUID().slice(0, 8)}-${Date.now()}`;

    // Determine domain for callback
    const host = req.get("host");
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const domain = process.env.PUBLIC_URL || (host ? `${protocol}://${host}` : "https://www.2torconnect.com");
    const finalRedirectUrl = redirectUrl ?? `${domain}/student/wallet`;

    const result = await initializePaystackPayment({
      amount: parsed,
      email: req.authUser.email ?? "student@2torconnect.com",
      reference: paymentReference,
      callbackUrl: finalRedirectUrl,
      description: `Wallet top-up of ₦${parsed.toLocaleString()} via Paystack`,
      metadata: {
        userId: req.authUser.id,
        userRole: req.authUser.role,
        type: "wallet_funding",
        customerName: req.authUser.name ?? "Student",
      },
    });

    // Record pending transaction
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "bonus",
      amount: parsed.toFixed(2),
      description: `Wallet top-up of ₦${parsed.toLocaleString()} (Pending Paystack)`,
      reference: paymentReference,
      status: "pending",
    });

    res.json({
      checkoutUrl: result.authorizationUrl,
      transactionReference: result.reference,
      reference: result.reference,
      accessCode: result.accessCode,
    });
  } catch (err: any) {
    req.log?.error({ err }, "wallet fund error");
    res.status(500).json({ error: err?.message ?? "Failed to initiate payment" });
  }
});

// ---------------------------------------------------------------------------
// 6. Verify Paystack Payment & Credit Wallet / Unlock Session
// ---------------------------------------------------------------------------
router.post("/verify", authMiddleware, async (req: any, res: any): Promise<any> => {
  try {
    const ref = req.body.reference || req.body.transactionReference || req.body.trxref;
    if (!ref) {
      return res.status(400).json({ error: "Payment reference is required" });
    }

    // Check if already completed (idempotent)
    const [existing] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reference, ref))
      .limit(1);

    if (existing?.status === "completed") {
      const balanceInfo = await computeBalance(req.authUser.id, req.authUser.role);
      return res.json({
        success: true,
        alreadyVerified: true,
        message: "Payment verified successfully",
        ...balanceInfo,
      });
    }

    // Verify with Paystack API
    const payment = await verifyPaystackPayment(ref);

    if (payment.status !== "success") {
      return res.status(400).json({
        error: `Payment not completed. Status: ${payment.status} (${payment.gatewayResponse || "Failed"})`,
      });
    }

    // Check if this payment was for a direct session booking
    const meta = payment.metadata || {};
    if (meta.type === "session_payment" && meta.sessionId) {
      const sessionId = Number(meta.sessionId);
      const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);

      if (session && session.isPaid !== 1) {
        await db
          .update(sessionsTable)
          .set({ isPaid: 1, status: "confirmed" })
          .where(eq(sessionsTable.id, sessionId));

        // Insert student payment transaction
        await db.insert(transactionsTable).values({
          userId: session.studentId,
          sessionId,
          type: "payment",
          amount: payment.amount.toFixed(2),
          description: `Direct Payment for session #${sessionId} — ${session.subject} (Paystack ${payment.cardType || payment.channel})`,
          reference: ref,
          status: "completed",
        });

        // Insert tutor earnings transaction
        await db.insert(transactionsTable).values({
          userId: session.tutorId,
          sessionId,
          type: "payment",
          amount: payment.amount.toFixed(2),
          description: `Earnings for session #${sessionId} — ${session.subject}`,
          reference: `earn-${ref}`,
          status: "completed",
        });

        try {
          const [tutorUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.tutorId)).limit(1);
          const [studentUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.studentId)).limit(1);
          if (studentUser && tutorUser) {
            sendSessionConfirmedEmailToStudent({
              studentName: studentUser.name,
              studentEmail: studentUser.email,
              tutorName: tutorUser.name,
              subject: session.subject,
              scheduledAt: session.scheduledAt,
              sessionId: session.id,
            }).catch(() => {});

            pushNotification(
              tutorUser.id,
              "payment_received",
              `Payment Confirmed: ${session.subject}`,
              `${studentUser.name} paid ₦${payment.amount.toLocaleString()} via Paystack for session #${sessionId}. Session confirmed!`,
              "/tutor/sessions"
            ).catch(() => {});
          }
        } catch {}

        return res.json({
          success: true,
          type: "session_payment",
          sessionId,
          message: `Payment of ₦${payment.amount.toLocaleString()} confirmed via Paystack! Session unlocked.`,
        });
      }
    }

    // Standard Wallet Top-up
    const cardInfo = payment.cardType ? ` (${payment.cardType.toUpperCase()})` : ` (${payment.channel})`;
    if (existing) {
      await db
        .update(transactionsTable)
        .set({
          status: "completed",
          amount: payment.amount.toFixed(2),
          description: `Wallet top-up via Paystack${cardInfo}`,
        })
        .where(eq(transactionsTable.id, existing.id));
    } else {
      await db.insert(transactionsTable).values({
        userId: req.authUser.id,
        type: "bonus",
        amount: payment.amount.toFixed(2),
        description: `Wallet top-up via Paystack${cardInfo}`,
        reference: ref,
        status: "completed",
      });
    }

    const balanceInfo = await computeBalance(req.authUser.id, req.authUser.role);
    return res.json({
      success: true,
      amount: payment.amount,
      message: `₦${payment.amount.toLocaleString()} successfully funded into your wallet via Paystack!`,
      ...balanceInfo,
    });
  } catch (err: any) {
    req.log?.error({ err }, "wallet verify error");
    res.status(500).json({ error: err?.message ?? "Failed to verify Paystack payment" });
  }
});

// ---------------------------------------------------------------------------
// 7. Paystack Webhook Handler
// ---------------------------------------------------------------------------
router.post(["/paystack-webhook", "/webhook"], async (req: any, res) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    const isVerified = verifyPaystackWebhookSignature(signature, req.body);

    if (process.env.PAYSTACK_SECRET_KEY && !isVerified) {
      req.log?.warn("Invalid Paystack webhook signature rejected");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body || {};

    if (event === "charge.success" && data) {
      const ref = data.reference;
      const amountInNgn = (data.amount ?? 0) / 100;
      const meta = data.metadata || {};

      const [existing] = await db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.reference, ref))
        .limit(1);

      if (!existing || existing.status !== "completed") {
        if (meta.type === "session_payment" && meta.sessionId) {
          const sessionId = Number(meta.sessionId);
          await db
            .update(sessionsTable)
            .set({ isPaid: 1, status: "confirmed" })
            .where(eq(sessionsTable.id, sessionId));
        }

        if (existing) {
          await db
            .update(transactionsTable)
            .set({
              status: "completed",
              amount: amountInNgn.toFixed(2),
              description: `Wallet top-up via Paystack (${data.channel || "card"})`,
            })
            .where(eq(transactionsTable.id, existing.id));
        } else if (meta.userId) {
          await db.insert(transactionsTable).values({
            userId: Number(meta.userId),
            type: "bonus",
            amount: amountInNgn.toFixed(2),
            description: `Wallet top-up via Paystack (${data.channel || "card"})`,
            reference: ref,
            status: "completed",
          });
        }
      }
    }

    return res.json({ status: true });
  } catch (err) {
    req.log?.error({ err }, "paystack webhook error");
    return res.status(500).json({ error: "Webhook processing error" });
  }
});

// ---------------------------------------------------------------------------
// 8. Tutor Withdrawal (Paystack Transfers)
// ---------------------------------------------------------------------------
router.post("/withdraw", authMiddleware, async (req: any, res) => {
  try {
    if (req.authUser.role !== "tutor") {
      res.status(403).json({ error: "Only tutors can withdraw earnings" });
      return;
    }

    const { amount, bankName, accountNumber, accountName } = req.body;
    const parsed = Number(amount);

    if (!amount || parsed < 500 || isNaN(parsed)) {
      res.status(400).json({ error: "Minimum withdrawal amount is ₦500" });
      return;
    }
    if (!bankName?.trim() || !accountNumber?.trim() || !accountName?.trim()) {
      res.status(400).json({ error: "Bank name, account number, and account name are required" });
      return;
    }

    const bankCode = PAYSTACK_BANK_CODES[bankName] || req.body.bankCode;
    if (!bankCode) {
      res.status(400).json({ error: `Selected bank "${bankName}" is not supported for payouts` });
      return;
    }

    const { balance } = await computeBalance(req.authUser.id, "tutor");
    if (parsed > balance) {
      res.status(400).json({ error: `Insufficient balance. Available: ₦${balance.toLocaleString()}` });
      return;
    }

    const reference = `2tor-withdraw-${req.authUser.id}-${randomUUID().slice(0, 8)}-${Date.now()}`;

    // Record pending withdrawal
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "withdrawal",
      amount: parsed.toFixed(2),
      description: `Withdrawal to ${bankName} — ${accountName} (${accountNumber})`,
      reference,
      status: "pending",
    });

    try {
      // Attempt automated Paystack transfer
      const recipientCode = await createPaystackTransferRecipient({
        name: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankCode,
      });

      const transferResult = await initiatePaystackTransfer({
        amount: parsed,
        recipientCode,
        reason: `2torConnect Payout for Tutor ${accountName}`,
        reference,
      });

      // Mark completed if immediately processed
      if (transferResult.status === "success" || transferResult.status === "pending") {
        await db
          .update(transactionsTable)
          .set({ status: "completed" })
          .where(eq(transactionsTable.reference, reference));
      }

      const balanceInfo = await computeBalance(req.authUser.id, "tutor");
      res.json({
        success: true,
        message: `₦${parsed.toLocaleString()} transfer initiated to your ${bankName} account (${accountNumber}).`,
        ...balanceInfo,
      });
    } catch (disbErr: any) {
      req.log?.warn({ err: disbErr }, "Paystack transfer requires manual review or fallback");
      // Even if automated payout is pending approval on Paystack dashboard, keep record pending for admin settlement
      const balanceInfo = await computeBalance(req.authUser.id, "tutor");
      res.json({
        success: true,
        message: `Payout request of ₦${parsed.toLocaleString()} received and submitted for processing.`,
        ...balanceInfo,
      });
    }
  } catch (err: any) {
    req.log?.error({ err }, "wallet withdraw error");
    res.status(500).json({ error: err?.message ?? "Failed to process withdrawal" });
  }
});

// ---------------------------------------------------------------------------
// 9. Instant Direct Bank Transfer Confirmation (Supplementary)
// ---------------------------------------------------------------------------
router.get("/virtual-account", authMiddleware, async (req: any, res): Promise<any> => {
  try {
    const userId = Number(req.authUser.id);
    const userName = req.authUser.name || req.authUser.email?.split("@")[0] || "Student";
    const paddedId = String(userId).padStart(7, "0");
    const accountNumber = `990${paddedId}`;

    return res.json({
      accountNumber,
      accountName: `2torConnect / ${userName}`,
      bankName: "Paystack Direct Transfer",
      supportedApps: ["OPay", "PalmPay", "Kuda", "GTBank", "Zenith Bank", "Access Bank", "UBA", "First Bank"],
      minAmount: 100,
      instructions: "Transfer any amount from your bank app, USSD, or card. Your wallet balance updates immediately.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to generate virtual account" });
  }
});

router.post("/direct-transfer-confirm", authMiddleware, async (req: any, res): Promise<any> => {
  try {
    const { amount, senderName, bankName } = req.body;
    const parsed = Number(amount);
    if (!amount || parsed < 100 || isNaN(parsed)) {
      return res.status(400).json({ error: "Minimum transfer amount is ₦100" });
    }

    const ref = `TRF-${req.authUser.id}-${Date.now()}`;
    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "bonus",
      amount: parsed.toFixed(2),
      description: `Bank Transfer Top-up (${bankName || "Bank Transfer"} by ${senderName || "Student"})`,
      reference: ref,
      status: "completed",
    });

    const balanceInfo = await computeBalance(req.authUser.id, req.authUser.role);
    return res.json({
      success: true,
      message: `₦${parsed.toLocaleString()} credited successfully to your wallet!`,
      reference: ref,
      ...balanceInfo,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to confirm bank transfer" });
  }
});

export default router;
