import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, tutorsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const KNOWN_UNIS: Record<string, { name: string; acronym: string; state: string; type: string; established: number; website: string; color: string }> = {
  "university of lagos": { name: "University of Lagos", acronym: "UNILAG", state: "Lagos", type: "Federal", established: 1962, website: "https://unilag.edu.ng", color: "from-blue-500 to-cyan-400" },
  "unilag": { name: "University of Lagos", acronym: "UNILAG", state: "Lagos", type: "Federal", established: 1962, website: "https://unilag.edu.ng", color: "from-blue-500 to-cyan-400" },
  "university of ibadan": { name: "University of Ibadan", acronym: "UI", state: "Oyo", type: "Federal", established: 1948, website: "https://ui.edu.ng", color: "from-purple-500 to-indigo-400" },
  "obafemi awolowo university": { name: "Obafemi Awolowo University", acronym: "OAU", state: "Osun", type: "Federal", established: 1961, website: "https://oauife.edu.ng", color: "from-green-500 to-emerald-400" },
  "university of nigeria": { name: "University of Nigeria, Nsukka", acronym: "UNN", state: "Enugu", type: "Federal", established: 1960, website: "https://unn.edu.ng", color: "from-red-500 to-orange-400" },
  "university of nigeria nsukka": { name: "University of Nigeria, Nsukka", acronym: "UNN", state: "Enugu", type: "Federal", established: 1960, website: "https://unn.edu.ng", color: "from-red-500 to-orange-400" },
  "ahmadu bello university": { name: "Ahmadu Bello University", acronym: "ABU", state: "Kaduna", type: "Federal", established: 1962, website: "https://abu.edu.ng", color: "from-yellow-500 to-amber-400" },
  "abu zaria": { name: "Ahmadu Bello University", acronym: "ABU", state: "Kaduna", type: "Federal", established: 1962, website: "https://abu.edu.ng", color: "from-yellow-500 to-amber-400" },
  "university of benin": { name: "University of Benin", acronym: "UNIBEN", state: "Edo", type: "Federal", established: 1970, website: "https://uniben.edu.ng", color: "from-teal-500 to-cyan-400" },
  "futa": { name: "Federal University of Technology Akure", acronym: "FUTA", state: "Ondo", type: "Federal", established: 1981, website: "https://futa.edu.ng", color: "from-pink-500 to-rose-400" },
  "federal university dutse": { name: "Federal University Dutse", acronym: "FUD", state: "Jigawa", type: "Federal", established: 2011, website: "https://fud.edu.ng", color: "from-emerald-500 to-green-400" },
  "covenant university": { name: "Covenant University", acronym: "CU", state: "Ogun", type: "Private", established: 2002, website: "https://covenantuniversity.edu.ng", color: "from-violet-500 to-purple-400" },
  "babcock university": { name: "Babcock University", acronym: "BU", state: "Ogun", type: "Private", established: 1999, website: "https://babcock.edu.ng", color: "from-sky-500 to-blue-400" },
  "lagos state university": { name: "Lagos State University", acronym: "LASU", state: "Lagos", type: "State", established: 1983, website: "https://lasu.edu.ng", color: "from-lime-500 to-green-400" },
  "pan-atlantic university": { name: "Pan-Atlantic University", acronym: "PAU", state: "Lagos", type: "Private", established: 2002, website: "https://pau.edu.ng", color: "from-orange-500 to-yellow-400" },
  "university of port harcourt": { name: "University of Port Harcourt", acronym: "UNIPORT", state: "Rivers", type: "Federal", established: 1975, website: "https://uniport.edu.ng", color: "from-cyan-500 to-sky-400" },
  "nnamdi azikiwe university": { name: "Nnamdi Azikiwe University", acronym: "UNIZIK", state: "Anambra", type: "Federal", established: 1991, website: "https://unizik.edu.ng", color: "from-indigo-500 to-blue-400" },
  "university of abuja": { name: "University of Abuja", acronym: "UNIABUJA", state: "FCT", type: "Federal", established: 1988, website: "https://uniabuja.edu.ng", color: "from-emerald-500 to-teal-400" },
  "lautech": { name: "Ladoke Akintola University of Technology", acronym: "LAUTECH", state: "Oyo", type: "State", established: 1990, website: "https://lautech.edu.ng", color: "from-fuchsia-500 to-pink-400" },
};

const COLOR_POOL = [
  "from-blue-500 to-cyan-400", "from-purple-500 to-indigo-400", "from-green-500 to-emerald-400",
  "from-red-500 to-orange-400", "from-yellow-500 to-amber-400", "from-teal-500 to-cyan-400",
  "from-pink-500 to-rose-400", "from-violet-500 to-purple-400", "from-sky-500 to-blue-400",
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function makeAcronym(name: string): string {
  const words = name.replace(/[^a-zA-Z\s]/g, " ").split(/\s+/).filter(w => w && !["of", "the", "and", "a", "an"].includes(w.toLowerCase()));
  return words.map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 6) || name.slice(0, 4).toUpperCase();
}

router.get("/", async (_req, res) => {
  try {
    const studentRows = await db.select({ uni: studentsTable.university, userId: studentsTable.userId })
      .from(studentsTable).where(sql`${studentsTable.university} IS NOT NULL`);
    const tutorRows = await db.select({ uni: tutorsTable.university, userId: tutorsTable.userId })
      .from(tutorsTable).where(sql`${tutorsTable.university} IS NOT NULL`);

    const map = new Map<string, { rawName: string; students: number; tutors: number }>();

    for (const r of studentRows) {
      if (!r.uni) continue;
      const key = normalize(r.uni);
      const e = map.get(key) ?? { rawName: r.uni.trim(), students: 0, tutors: 0 };
      e.students++;
      map.set(key, e);
    }
    for (const r of tutorRows) {
      if (!r.uni) continue;
      const key = normalize(r.uni);
      const e = map.get(key) ?? { rawName: r.uni.trim(), students: 0, tutors: 0 };
      e.tutors++;
      map.set(key, e);
    }

    const real = Array.from(map.entries()).map(([key, v], idx) => {
      const meta = KNOWN_UNIS[key];
      const name = meta?.name ?? v.rawName.replace(/\b\w/g, c => c.toUpperCase());
      return {
        name,
        acronym: meta?.acronym ?? makeAcronym(name),
        state: meta?.state ?? "Nigeria",
        type: meta?.type ?? "University",
        established: meta?.established ?? null,
        website: meta?.website ?? null,
        color: meta?.color ?? COLOR_POOL[idx % COLOR_POOL.length],
        studentsCount: v.students,
        tutorsCount: v.tutors,
        active: true,
      };
    }).sort((a, b) => (b.studentsCount + b.tutorsCount) - (a.studentsCount + a.tutorsCount));

    const realNames = new Set(real.map(r => normalize(r.name)));
    const featured = Object.values(KNOWN_UNIS).reduce<typeof real>((acc, meta) => {
      const k = normalize(meta.name);
      if (realNames.has(k) || acc.find(x => normalize(x.name) === k)) return acc;
      acc.push({ ...meta, established: meta.established, website: meta.website, studentsCount: 0, tutorsCount: 0, active: false });
      return acc;
    }, []);

    res.json({ active: real, featured, total: real.length + featured.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load universities", message: err.message });
  }
});

export default router;
