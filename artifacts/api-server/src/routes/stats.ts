import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, studentsTable, transactionsTable } from "@workspace/db";
import { eq, count, sum, countDistinct } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const [studentsResult] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "student"));

    const [tutorsResult] = await db
      .select({ value: count() })
      .from(tutorsTable)
      .where(eq(tutorsTable.isVerified, true));

    const tutorUnis = db
      .selectDistinct({ university: tutorsTable.university })
      .from(tutorsTable)
      .where(sql`${tutorsTable.university} is not null`);

    const studentUnis = db
      .selectDistinct({ university: studentsTable.university })
      .from(studentsTable)
      .where(sql`${studentsTable.university} is not null`);

    const combined = await db.execute(
      sql`SELECT COUNT(*) as value FROM (
        SELECT university FROM tutors WHERE university IS NOT NULL
        UNION
        SELECT university FROM students WHERE university IS NOT NULL
      ) u`
    );

    const [earningsResult] = await db
      .select({ value: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "completed"));

    res.json({
      students: Number(studentsResult.value),
      verifiedTutors: Number(tutorsResult.value),
      universities: Number((combined.rows[0] as any).value),
      totalEarnings: Number(earningsResult.value ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "stats error");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
