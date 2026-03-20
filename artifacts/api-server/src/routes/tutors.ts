import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, tutorsTable, availabilityTable } from "@workspace/db";
import { eq, ilike, or, count, and, arrayContains } from "drizzle-orm";
import { UpdateTutorBody, SetTutorAvailabilityBody } from "@workspace/api-zod";

const router: IRouter = Router();

function buildTutorProfile(tutor: any, user: any) {
  return {
    id: tutor.id,
    userId: tutor.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    university: tutor.university,
    faculty: tutor.faculty,
    department: tutor.department,
    level: tutor.level,
    aboutYou: tutor.aboutYou,
    subjects: tutor.subjects,
    hourlyRate: tutor.hourlyRate,
    rating: tutor.rating,
    totalSessions: tutor.totalSessions,
    isVerified: tutor.isVerified,
    applicationDate: tutor.applicationDate,
  };
}

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { subject, status, search } = req.query;

    const userConditions = [];
    if (status) userConditions.push(eq(usersTable.status, status as any));
    if (search) {
      userConditions.push(or(
        ilike(usersTable.name, `%${search}%`),
        ilike(usersTable.email, `%${search}%`)
      )!);
    }

    const rows = await db
      .select({ tutor: tutorsTable, user: usersTable })
      .from(tutorsTable)
      .innerJoin(usersTable, eq(tutorsTable.userId, usersTable.id))
      .where(userConditions.length > 0 ? and(...userConditions) : undefined)
      .limit(limit)
      .offset(offset);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(tutorsTable)
      .innerJoin(usersTable, eq(tutorsTable.userId, usersTable.id))
      .where(userConditions.length > 0 ? and(...userConditions) : undefined);

    const tutors = rows
      .filter(r => !subject || (r.tutor.subjects ?? []).includes(subject as string))
      .map(r => buildTutorProfile(r.tutor, r.user));

    res.json({ tutors, total: Number(total), page, limit });
  } catch (err) {
    req.log.error({ err }, "list tutors error");
    res.status(500).json({ error: "Failed to list tutors" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({ tutor: tutorsTable, user: usersTable })
      .from(tutorsTable)
      .innerJoin(usersTable, eq(tutorsTable.userId, usersTable.id))
      .where(eq(tutorsTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Tutor not found" });
      return;
    }
    res.json(buildTutorProfile(row.tutor, row.user));
  } catch (err) {
    req.log.error({ err }, "get tutor error");
    res.status(500).json({ error: "Failed to get tutor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = UpdateTutorBody.parse(req.body);
    const updateData: any = {};
    if (body.university !== undefined) updateData.university = body.university;
    if (body.faculty !== undefined) updateData.faculty = body.faculty;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.aboutYou !== undefined) updateData.aboutYou = body.aboutYou;
    if (body.subjects !== undefined) updateData.subjects = body.subjects;
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

    const [tutor] = await db.update(tutorsTable).set(updateData).where(eq(tutorsTable.id, id)).returning();
    if (!tutor) {
      res.status(404).json({ error: "Tutor not found" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tutor.userId)).limit(1);
    res.json(buildTutorProfile(tutor, user));
  } catch (err) {
    req.log.error({ err }, "update tutor error");
    res.status(500).json({ error: "Failed to update tutor" });
  }
});

router.get("/:id/availability", async (req, res) => {
  try {
    const tutorId = Number(req.params.id);
    const slots = await db.select().from(availabilityTable).where(eq(availabilityTable.tutorId, tutorId));
    res.json({ slots });
  } catch (err) {
    req.log.error({ err }, "get availability error");
    res.status(500).json({ error: "Failed to get availability" });
  }
});

router.put("/:id/availability", async (req, res) => {
  try {
    const tutorId = Number(req.params.id);
    const body = SetTutorAvailabilityBody.parse(req.body);
    await db.delete(availabilityTable).where(eq(availabilityTable.tutorId, tutorId));
    if (body.slots.length > 0) {
      await db.insert(availabilityTable).values(
        body.slots.map((slot: any) => ({
          tutorId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable ?? true,
        }))
      );
    }
    const slots = await db.select().from(availabilityTable).where(eq(availabilityTable.tutorId, tutorId));
    res.json({ slots });
  } catch (err) {
    req.log.error({ err }, "set availability error");
    res.status(500).json({ error: "Failed to set availability" });
  }
});

export default router;
