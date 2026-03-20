import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { userId, type, status } = req.query;

    const conditions = [];
    if (userId) conditions.push(eq(transactionsTable.userId, Number(userId)));
    if (type) conditions.push(eq(transactionsTable.type, type as any));
    if (status) conditions.push(eq(transactionsTable.status, status as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const txns = await db
      .select({ transaction: transactionsTable, userName: usersTable.name })
      .from(transactionsTable)
      .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(transactionsTable.createdAt);

    const [{ value: total }] = await db.select({ value: count() }).from(transactionsTable).where(where);

    res.json({
      transactions: txns.map(r => ({
        ...r.transaction,
        userName: r.userName,
      })),
      total: Number(total),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "list transactions error");
    res.status(500).json({ error: "Failed to list transactions" });
  }
});

export default router;
