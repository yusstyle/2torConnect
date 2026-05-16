import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, referralsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { pushNotification } from "./notifications";

const router = Router();

function generateCode(name: string, id: number): string {
  const clean = name.replace(/\s+/g, "").slice(0, 5).toUpperCase();
  return `${clean}${id}`;
}

router.get("/my-code", async (req, res) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    let code = user.referralCode;
    if (!code) {
      code = generateCode(user.name, userId);
      const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, code));
      if (existing.length > 0) code = `${code}X`;
      await db.update(usersTable).set({ referralCode: code }).where(eq(usersTable.id, userId));
    }

    const referrals = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, userId));
    return res.json({ code, referralCount: referrals.length, referralLink: `https://2torconnect.replit.app/register?ref=${code}` });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get referral code" });
  }
});

router.post("/claim", async (req, res) => {
  try {
    const newUserId = Number((req as any).user?.id);
    if (!newUserId) return res.status(401).json({ error: "Unauthorized" });
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Referral code required" });

    const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, code.toUpperCase()));
    if (!referrer) return res.status(404).json({ error: "Invalid referral code" });
    if (referrer.id === newUserId) return res.status(400).json({ error: "Cannot use your own referral code" });

    const existing = await db.select({ id: referralsTable.id }).from(referralsTable).where(and(eq(referralsTable.referrerId, referrer.id), eq(referralsTable.referredId, newUserId)));
    if (existing.length > 0) return res.status(400).json({ error: "Referral already claimed" });

    await db.insert(referralsTable).values({ referrerId: referrer.id, referredId: newUserId });

    await db.insert(transactionsTable).values({
      userId: referrer.id,
      type: "bonus",
      amount: "500",
      description: `Referral bonus — new user joined with your code`,
      status: "completed",
    });

    await db.insert(transactionsTable).values({
      userId: newUserId,
      type: "bonus",
      amount: "200",
      description: `Welcome bonus — joined via referral code ${code}`,
      status: "completed",
    });

    await pushNotification(referrer.id, "referral", "Referral Bonus Credited!", "Someone joined using your referral code. ₦500 has been added to your wallet.", "/student/wallet");
    return res.json({ success: true, message: "Referral applied! ₦200 welcome bonus added to your wallet." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to claim referral" });
  }
});

export default router;
