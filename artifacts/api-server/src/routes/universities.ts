import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, tutorsTable, usersTable, sessionsTable, transactionsTable } from "@workspace/db";
import { sql, eq, or, count, and } from "drizzle-orm";

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7), "base64").toString("utf8"));
    req.authUser = payload;
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
}

const router: IRouter = Router();

interface UniMeta {
  name: string; acronym: string; location: string; country: string;
  type: string; established: number; website: string; color: string;
}

const KNOWN_UNIS: Record<string, UniMeta> = {
  // â”€â”€ Nigeria â”€â”€
  "university of lagos": { name: "University of Lagos", acronym: "UNILAG", location: "Lagos", country: "Nigeria", type: "Federal", established: 1962, website: "https://unilag.edu.ng", color: "from-blue-500 to-cyan-400" },
  "unilag": { name: "University of Lagos", acronym: "UNILAG", location: "Lagos", country: "Nigeria", type: "Federal", established: 1962, website: "https://unilag.edu.ng", color: "from-blue-500 to-cyan-400" },
  "university of ibadan": { name: "University of Ibadan", acronym: "UI", location: "Ibadan", country: "Nigeria", type: "Federal", established: 1948, website: "https://ui.edu.ng", color: "from-purple-500 to-indigo-400" },
  "obafemi awolowo university": { name: "Obafemi Awolowo University", acronym: "OAU", location: "Ile-Ife", country: "Nigeria", type: "Federal", established: 1961, website: "https://oauife.edu.ng", color: "from-green-500 to-emerald-400" },
  "university of nigeria": { name: "University of Nigeria, Nsukka", acronym: "UNN", location: "Nsukka", country: "Nigeria", type: "Federal", established: 1960, website: "https://unn.edu.ng", color: "from-red-500 to-orange-400" },
  "university of nigeria nsukka": { name: "University of Nigeria, Nsukka", acronym: "UNN", location: "Nsukka", country: "Nigeria", type: "Federal", established: 1960, website: "https://unn.edu.ng", color: "from-red-500 to-orange-400" },
  "ahmadu bello university": { name: "Ahmadu Bello University", acronym: "ABU", location: "Zaria", country: "Nigeria", type: "Federal", established: 1962, website: "https://abu.edu.ng", color: "from-yellow-500 to-amber-400" },
  "abu zaria": { name: "Ahmadu Bello University", acronym: "ABU", location: "Zaria", country: "Nigeria", type: "Federal", established: 1962, website: "https://abu.edu.ng", color: "from-yellow-500 to-amber-400" },
  "university of benin": { name: "University of Benin", acronym: "UNIBEN", location: "Benin City", country: "Nigeria", type: "Federal", established: 1970, website: "https://uniben.edu.ng", color: "from-teal-500 to-cyan-400" },
  "federal university of technology akure": { name: "Federal University of Technology Akure", acronym: "FUTA", location: "Akure", country: "Nigeria", type: "Federal", established: 1981, website: "https://futa.edu.ng", color: "from-pink-500 to-rose-400" },
  "futa": { name: "Federal University of Technology Akure", acronym: "FUTA", location: "Akure", country: "Nigeria", type: "Federal", established: 1981, website: "https://futa.edu.ng", color: "from-pink-500 to-rose-400" },
  "covenant university": { name: "Covenant University", acronym: "CU", location: "Ota, Ogun", country: "Nigeria", type: "Private", established: 2002, website: "https://covenantuniversity.edu.ng", color: "from-violet-500 to-purple-400" },
  "babcock university": { name: "Babcock University", acronym: "BU", location: "Ilishan-Remo", country: "Nigeria", type: "Private", established: 1999, website: "https://babcock.edu.ng", color: "from-sky-500 to-blue-400" },
  "lagos state university": { name: "Lagos State University", acronym: "LASU", location: "Ojo, Lagos", country: "Nigeria", type: "State", established: 1983, website: "https://lasu.edu.ng", color: "from-lime-500 to-green-400" },
  "university of port harcourt": { name: "University of Port Harcourt", acronym: "UNIPORT", location: "Port Harcourt", country: "Nigeria", type: "Federal", established: 1975, website: "https://uniport.edu.ng", color: "from-cyan-500 to-sky-400" },
  "nnamdi azikiwe university": { name: "Nnamdi Azikiwe University", acronym: "UNIZIK", location: "Awka", country: "Nigeria", type: "Federal", established: 1991, website: "https://unizik.edu.ng", color: "from-indigo-500 to-blue-400" },
  "university of abuja": { name: "University of Abuja", acronym: "UNIABUJA", location: "Abuja", country: "Nigeria", type: "Federal", established: 1988, website: "https://uniabuja.edu.ng", color: "from-emerald-500 to-teal-400" },
  "lautech": { name: "Ladoke Akintola University of Technology", acronym: "LAUTECH", location: "Ogbomoso", country: "Nigeria", type: "State", established: 1990, website: "https://lautech.edu.ng", color: "from-fuchsia-500 to-pink-400" },
  "bayero university kano": { name: "Bayero University Kano", acronym: "BUK", location: "Kano", country: "Nigeria", type: "Federal", established: 1975, website: "https://buk.edu.ng", color: "from-orange-500 to-red-400" },
  "federal university dutse": { name: "Federal University Dutse", acronym: "FUD", location: "Dutse", country: "Nigeria", type: "Federal", established: 2011, website: "https://fud.edu.ng", color: "from-emerald-500 to-green-400" },

  // â”€â”€ USA â”€â”€
  "harvard university": { name: "Harvard University", acronym: "Harvard", location: "Cambridge, MA", country: "USA", type: "Private", established: 1636, website: "https://harvard.edu", color: "from-red-600 to-red-400" },
  "massachusetts institute of technology": { name: "Massachusetts Institute of Technology", acronym: "MIT", location: "Cambridge, MA", country: "USA", type: "Private", established: 1861, website: "https://mit.edu", color: "from-gray-600 to-red-500" },
  "mit": { name: "Massachusetts Institute of Technology", acronym: "MIT", location: "Cambridge, MA", country: "USA", type: "Private", established: 1861, website: "https://mit.edu", color: "from-gray-600 to-red-500" },
  "stanford university": { name: "Stanford University", acronym: "Stanford", location: "Stanford, CA", country: "USA", type: "Private", established: 1885, website: "https://stanford.edu", color: "from-red-500 to-orange-400" },
  "yale university": { name: "Yale University", acronym: "Yale", location: "New Haven, CT", country: "USA", type: "Private", established: 1701, website: "https://yale.edu", color: "from-blue-700 to-blue-500" },
  "princeton university": { name: "Princeton University", acronym: "Princeton", location: "Princeton, NJ", country: "USA", type: "Private", established: 1746, website: "https://princeton.edu", color: "from-orange-500 to-yellow-400" },
  "columbia university": { name: "Columbia University", acronym: "Columbia", location: "New York, NY", country: "USA", type: "Private", established: 1754, website: "https://columbia.edu", color: "from-blue-600 to-cyan-400" },
  "university of chicago": { name: "University of Chicago", acronym: "UChicago", location: "Chicago, IL", country: "USA", type: "Private", established: 1890, website: "https://uchicago.edu", color: "from-red-700 to-red-500" },
  "university of california berkeley": { name: "UC Berkeley", acronym: "UC Berkeley", location: "Berkeley, CA", country: "USA", type: "Public", established: 1868, website: "https://berkeley.edu", color: "from-blue-600 to-yellow-500" },
  "university of michigan": { name: "University of Michigan", acronym: "UMich", location: "Ann Arbor, MI", country: "USA", type: "Public", established: 1817, website: "https://umich.edu", color: "from-blue-700 to-yellow-400" },
  "johns hopkins university": { name: "Johns Hopkins University", acronym: "JHU", location: "Baltimore, MD", country: "USA", type: "Private", established: 1876, website: "https://jhu.edu", color: "from-blue-600 to-sky-400" },
  "new york university": { name: "New York University", acronym: "NYU", location: "New York, NY", country: "USA", type: "Private", established: 1831, website: "https://nyu.edu", color: "from-violet-600 to-purple-400" },
  "university of texas austin": { name: "University of Texas at Austin", acronym: "UT Austin", location: "Austin, TX", country: "USA", type: "Public", established: 1883, website: "https://utexas.edu", color: "from-orange-600 to-yellow-400" },
  "university of washington": { name: "University of Washington", acronym: "UW", location: "Seattle, WA", country: "USA", type: "Public", established: 1861, website: "https://washington.edu", color: "from-purple-600 to-purple-400" },

  // â”€â”€ UK â”€â”€
  "university of oxford": { name: "University of Oxford", acronym: "Oxford", location: "Oxford", country: "UK", type: "Public", established: 1096, website: "https://ox.ac.uk", color: "from-blue-700 to-indigo-500" },
  "oxford": { name: "University of Oxford", acronym: "Oxford", location: "Oxford", country: "UK", type: "Public", established: 1096, website: "https://ox.ac.uk", color: "from-blue-700 to-indigo-500" },
  "university of cambridge": { name: "University of Cambridge", acronym: "Cambridge", location: "Cambridge", country: "UK", type: "Public", established: 1209, website: "https://cam.ac.uk", color: "from-cyan-600 to-blue-400" },
  "cambridge": { name: "University of Cambridge", acronym: "Cambridge", location: "Cambridge", country: "UK", type: "Public", established: 1209, website: "https://cam.ac.uk", color: "from-cyan-600 to-blue-400" },
  "imperial college london": { name: "Imperial College London", acronym: "Imperial", location: "London", country: "UK", type: "Public", established: 1907, website: "https://imperial.ac.uk", color: "from-blue-600 to-sky-400" },
  "ucl": { name: "University College London", acronym: "UCL", location: "London", country: "UK", type: "Public", established: 1826, website: "https://ucl.ac.uk", color: "from-purple-600 to-indigo-400" },
  "london school of economics": { name: "London School of Economics", acronym: "LSE", location: "London", country: "UK", type: "Public", established: 1895, website: "https://lse.ac.uk", color: "from-red-600 to-rose-400" },
  "university of edinburgh": { name: "University of Edinburgh", acronym: "Edinburgh", location: "Edinburgh", country: "UK", type: "Public", established: 1583, website: "https://ed.ac.uk", color: "from-blue-700 to-blue-500" },
  "university of manchester": { name: "University of Manchester", acronym: "UoM", location: "Manchester", country: "UK", type: "Public", established: 1824, website: "https://manchester.ac.uk", color: "from-yellow-500 to-amber-400" },
  "king's college london": { name: "King's College London", acronym: "KCL", location: "London", country: "UK", type: "Public", established: 1829, website: "https://kcl.ac.uk", color: "from-red-600 to-red-400" },

  // â”€â”€ Canada â”€â”€
  "university of toronto": { name: "University of Toronto", acronym: "UofT", location: "Toronto", country: "Canada", type: "Public", established: 1827, website: "https://utoronto.ca", color: "from-blue-700 to-blue-500" },
  "mcgill university": { name: "McGill University", acronym: "McGill", location: "Montreal", country: "Canada", type: "Public", established: 1821, website: "https://mcgill.ca", color: "from-red-600 to-red-400" },
  "university of british columbia": { name: "University of British Columbia", acronym: "UBC", location: "Vancouver", country: "Canada", type: "Public", established: 1908, website: "https://ubc.ca", color: "from-blue-600 to-teal-400" },
  "university of waterloo": { name: "University of Waterloo", acronym: "UWaterloo", location: "Waterloo", country: "Canada", type: "Public", established: 1957, website: "https://uwaterloo.ca", color: "from-yellow-500 to-amber-400" },

  // â”€â”€ Australia â”€â”€
  "australian national university": { name: "Australian National University", acronym: "ANU", location: "Canberra", country: "Australia", type: "Public", established: 1946, website: "https://anu.edu.au", color: "from-yellow-500 to-orange-400" },
  "university of melbourne": { name: "University of Melbourne", acronym: "UniMelb", location: "Melbourne", country: "Australia", type: "Public", established: 1853, website: "https://unimelb.edu.au", color: "from-blue-700 to-blue-500" },
  "university of sydney": { name: "University of Sydney", acronym: "USYD", location: "Sydney", country: "Australia", type: "Public", established: 1850, website: "https://sydney.edu.au", color: "from-red-600 to-orange-400" },

  // â”€â”€ Europe â”€â”€
  "eth zurich": { name: "ETH Zurich", acronym: "ETH", location: "Zurich", country: "Switzerland", type: "Public", established: 1855, website: "https://ethz.ch", color: "from-blue-600 to-cyan-400" },
  "technical university of munich": { name: "Technical University of Munich", acronym: "TUM", location: "Munich", country: "Germany", type: "Public", established: 1868, website: "https://tum.de", color: "from-blue-700 to-blue-500" },
  "sorbonne university": { name: "Sorbonne University", acronym: "Sorbonne", location: "Paris", country: "France", type: "Public", established: 1257, website: "https://sorbonne-universite.fr", color: "from-blue-600 to-indigo-400" },
  "delft university of technology": { name: "Delft University of Technology", acronym: "TU Delft", location: "Delft", country: "Netherlands", type: "Public", established: 1842, website: "https://tudelft.nl", color: "from-sky-600 to-blue-400" },

  // â”€â”€ Africa â”€â”€
  "university of cape town": { name: "University of Cape Town", acronym: "UCT", location: "Cape Town", country: "South Africa", type: "Public", established: 1829, website: "https://uct.ac.za", color: "from-blue-700 to-indigo-500" },
  "university of the witwatersrand": { name: "University of the Witwatersrand", acronym: "Wits", location: "Johannesburg", country: "South Africa", type: "Public", established: 1896, website: "https://wits.ac.za", color: "from-blue-600 to-sky-400" },
  "university of ghana": { name: "University of Ghana", acronym: "UG", location: "Accra", country: "Ghana", type: "Public", established: 1948, website: "https://ug.edu.gh", color: "from-green-600 to-yellow-400" },
  "kwame nkrumah university": { name: "Kwame Nkrumah University of Science and Technology", acronym: "KNUST", location: "Kumasi", country: "Ghana", type: "Public", established: 1952, website: "https://knust.edu.gh", color: "from-green-600 to-emerald-400" },
  "university of nairobi": { name: "University of Nairobi", acronym: "UoN", location: "Nairobi", country: "Kenya", type: "Public", established: 1956, website: "https://uonbi.ac.ke", color: "from-red-600 to-green-500" },
  "makerere university": { name: "Makerere University", acronym: "Makerere", location: "Kampala", country: "Uganda", type: "Public", established: 1922, website: "https://mak.ac.ug", color: "from-yellow-500 to-amber-400" },
  "university of dar es salaam": { name: "University of Dar es Salaam", acronym: "UDSM", location: "Dar es Salaam", country: "Tanzania", type: "Public", established: 1961, website: "https://udsm.ac.tz", color: "from-green-600 to-teal-400" },
  "addis ababa university": { name: "Addis Ababa University", acronym: "AAU", location: "Addis Ababa", country: "Ethiopia", type: "Public", established: 1950, website: "https://aau.edu.et", color: "from-green-600 to-yellow-400" },

  // â”€â”€ Asia â”€â”€
  "national university of singapore": { name: "National University of Singapore", acronym: "NUS", location: "Singapore", country: "Singapore", type: "Public", established: 1905, website: "https://nus.edu.sg", color: "from-blue-700 to-indigo-500" },
  "nus": { name: "National University of Singapore", acronym: "NUS", location: "Singapore", country: "Singapore", type: "Public", established: 1905, website: "https://nus.edu.sg", color: "from-blue-700 to-indigo-500" },
  "peking university": { name: "Peking University", acronym: "PKU", location: "Beijing", country: "China", type: "Public", established: 1898, website: "https://pku.edu.cn", color: "from-red-600 to-red-400" },
  "tsinghua university": { name: "Tsinghua University", acronym: "Tsinghua", location: "Beijing", country: "China", type: "Public", established: 1911, website: "https://tsinghua.edu.cn", color: "from-purple-600 to-violet-400" },
  "university of tokyo": { name: "University of Tokyo", acronym: "UTokyo", location: "Tokyo", country: "Japan", type: "Public", established: 1877, website: "https://u-tokyo.ac.jp", color: "from-blue-700 to-blue-500" },
  "indian institute of technology bombay": { name: "IIT Bombay", acronym: "IITB", location: "Mumbai", country: "India", type: "Public", established: 1958, website: "https://iitb.ac.in", color: "from-blue-600 to-sky-400" },
  "indian institute of technology delhi": { name: "IIT Delhi", acronym: "IITD", location: "New Delhi", country: "India", type: "Public", established: 1961, website: "https://iitd.ac.in", color: "from-orange-500 to-yellow-400" },
  "university of delhi": { name: "University of Delhi", acronym: "DU", location: "New Delhi", country: "India", type: "Public", established: 1922, website: "https://du.ac.in", color: "from-blue-600 to-indigo-400" },

  // â”€â”€ Middle East â”€â”€
  "american university of beirut": { name: "American University of Beirut", acronym: "AUB", location: "Beirut", country: "Lebanon", type: "Private", established: 1866, website: "https://aub.edu.lb", color: "from-red-600 to-red-400" },
  "king abdulaziz university": { name: "King Abdulaziz University", acronym: "KAU", location: "Jeddah", country: "Saudi Arabia", type: "Public", established: 1967, website: "https://kau.edu.sa", color: "from-green-600 to-teal-400" },
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
        location: meta?.location ?? "Unknown",
        country: meta?.country ?? "Unknown",
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


router.get("/info", async (req, res) => {
  try {
    const name = String(req.query.name ?? "").trim();
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const [nominatimRes, wikiRes] = await Promise.allSettled([
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&addressdetails=1`,
        { headers: { "User-Agent": "2torConnect/1.0 contact@2torconnect.com" }, signal: AbortSignal.timeout(6000) }
      ),
      fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, "_"))}`,
        { headers: { "User-Agent": "2torConnect/1.0" }, signal: AbortSignal.timeout(6000) }
      ),
    ]);

    let location: { lat: number; lon: number; display_name: string; address: any } | null = null;
    let wiki: { description: string; image: string | null; wikiUrl: string | null; coordinates: { lat: number; lon: number } | null } | null = null;

    if (nominatimRes.status === "fulfilled" && nominatimRes.value.ok) {
      const data = await nominatimRes.value.json() as any[];
      if (data.length > 0) {
        location = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name, address: data[0].address };
      }
    }

    if (wikiRes.status === "fulfilled" && wikiRes.value.ok) {
      const data = await wikiRes.value.json() as any;
      if (data.type !== "disambiguation" && !data.title?.includes("may refer to")) {
        wiki = {
          description: data.extract ?? null,
          image: data.originalimage?.source ?? data.thumbnail?.source ?? null,
          wikiUrl: data.content_urls?.desktop?.page ?? null,
          coordinates: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : null,
        };
      }
    }

    const coords = location ? { lat: location.lat, lon: location.lon } : (wiki?.coordinates ?? null);

    res.json({
      name,
      description: wiki?.description ?? null,
      image: wiki?.image ?? null,
      wikiUrl: wiki?.wikiUrl ?? null,
      coordinates: coords,
      displayAddress: location?.display_name ?? null,
      address: location?.address ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch university info", message: err.message });
  }
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) { res.json({ universities: [] }); return; }
  const qNorm = normalize(q);

  // Local KNOWN_UNIS match first â€” this is what actually catches acronyms
  // like "FUD", "UNILAG", "ABU" etc. The external Hipolabs API only does a
  // substring match against a school's FULL official name, so a search for
  // "fud" never matches "Federal University Dutse" (the letters "fud" don't
  // appear in that string). That's why acronym searches were coming up empty
  // even though "federal university dutse" is a key in KNOWN_UNIS below.
  const localMatches = new Map<string, { name: string; country: string; domain: string | null }>();
  for (const [key, meta] of Object.entries(KNOWN_UNIS)) {
    if (key.includes(qNorm) || normalize(meta.acronym).includes(qNorm)) {
      localMatches.set(meta.name, { name: meta.name, country: meta.country, domain: null });
    }
  }

  let externalResults: Array<{ name: string; country: string; domain: string | null }> = [];
  try {
    const url = `https://universities.hipolabs.com/search?name=${encodeURIComponent(q)}&limit=15`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json() as Array<{ name: string; country: string; domains: string[] }>;
      externalResults = data.slice(0, 15).map(u => ({
        name: u.name,
        country: u.country,
        domain: u.domains?.[0] ?? null,
      }));
    }
  } catch {
    // external lookup failed/timed out â€” local matches (if any) still get returned below
  }

  // Local matches first (they're the curated, known-good entries), then
  // external results, deduped by normalized name.
  const seen = new Set<string>();
  const merged: Array<{ name: string; country: string; domain: string | null }> = [];
  for (const u of [...localMatches.values(), ...externalResults]) {
    const k = normalize(u.name);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(u);
  }

  res.json({ universities: merged.slice(0, 15) });
});

router.get("/top-performers/:universityName", async (req, res) => {
  try {
    const universityName = decodeURIComponent(req.params.universityName);

    const studentRows = await db
      .select({
        userId: studentsTable.userId,
        name: usersTable.name,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        status: usersTable.status,
        university: studentsTable.university,
        sessionCount: count(sessionsTable.id),
      })
      .from(studentsTable)
      .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
      .leftJoin(sessionsTable, eq(sessionsTable.studentId, usersTable.id))
      .where(sql`LOWER(${studentsTable.university}) = LOWER(${universityName})`)
      .groupBy(studentsTable.userId, usersTable.id, usersTable.name, usersTable.email, usersTable.avatarUrl, usersTable.status, studentsTable.university)
      .orderBy(sql`COUNT(${sessionsTable.id}) DESC`)
      .limit(10);

    const tutorRows = await db
      .select({
        userId: tutorsTable.userId,
        name: usersTable.name,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        status: usersTable.status,
        university: tutorsTable.university,
        subjects: tutorsTable.subjects,
        aboutYou: tutorsTable.aboutYou,
        sessionCount: count(sessionsTable.id),
      })
      .from(tutorsTable)
      .innerJoin(usersTable, eq(tutorsTable.userId, usersTable.id))
      .leftJoin(sessionsTable, eq(sessionsTable.tutorId, usersTable.id))
      .where(sql`LOWER(${tutorsTable.university}) = LOWER(${universityName})`)
      .groupBy(tutorsTable.userId, usersTable.id, usersTable.name, usersTable.email, usersTable.avatarUrl, usersTable.status, tutorsTable.university, tutorsTable.subjects, tutorsTable.aboutYou)
      .orderBy(sql`COUNT(${sessionsTable.id}) DESC`)
      .limit(10);

    res.json({
      university: universityName,
      topStudents: studentRows.map(r => ({ ...r, role: "student" })),
      topTutors: tutorRows.map(r => ({ ...r, role: "tutor" })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load top performers", message: err.message });
  }
});

router.post("/sponsor", authMiddleware, async (req: any, res) => {
  try {
    if (req.authUser.role !== "investor") {
      res.status(403).json({ error: "Only investors can sponsor universities" });
      return;
    }
    const { universityName, amount, splitBetween } = req.body;
    const parsedAmount = Number(amount);
    if (!universityName?.trim() || !parsedAmount || parsedAmount <= 0) {
      res.status(400).json({ error: "University name and a positive amount are required" });
      return;
    }

    const split = splitBetween ?? "both";

    const studentRows = split === "tutors" ? [] : await db
      .select({ userId: studentsTable.userId, name: usersTable.name, sessionCount: count(sessionsTable.id) })
      .from(studentsTable)
      .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
      .leftJoin(sessionsTable, eq(sessionsTable.studentId, usersTable.id))
      .where(and(sql`LOWER(${studentsTable.university}) = LOWER(${universityName})`, eq(usersTable.status, "active")))
      .groupBy(studentsTable.userId, usersTable.id, usersTable.name)
      .orderBy(sql`COUNT(${sessionsTable.id}) DESC`)
      .limit(10);

    const tutorRows = split === "students" ? [] : await db
      .select({ userId: tutorsTable.userId, name: usersTable.name, sessionCount: count(sessionsTable.id) })
      .from(tutorsTable)
      .innerJoin(usersTable, eq(tutorsTable.userId, usersTable.id))
      .leftJoin(sessionsTable, eq(sessionsTable.tutorId, usersTable.id))
      .where(and(sql`LOWER(${tutorsTable.university}) = LOWER(${universityName})`, eq(usersTable.status, "active")))
      .groupBy(tutorsTable.userId, usersTable.id, usersTable.name)
      .orderBy(sql`COUNT(${sessionsTable.id}) DESC`)
      .limit(10);

    const recipients = [
      ...studentRows.map(r => ({ ...r, role: "student" })),
      ...tutorRows.map(r => ({ ...r, role: "tutor" })),
    ];

    if (recipients.length === 0) {
      res.status(400).json({ error: "No active users found at this university to receive sponsorship" });
      return;
    }

    const perPerson = Math.floor((parsedAmount / recipients.length) * 100) / 100;
    const actualTotal = perPerson * recipients.length;

    for (const recipient of recipients) {
      await db.insert(transactionsTable).values({
        userId: recipient.userId,
        type: "bonus",
        amount: perPerson.toFixed(2),
        description: `Sponsorship from investor â€” ${universityName} program`,
        status: "completed",
      });
    }

    await db.insert(transactionsTable).values({
      userId: req.authUser.id,
      type: "payment",
      amount: actualTotal.toFixed(2),
      description: `Sponsored ${recipients.length} users at ${universityName}`,
      status: "completed",
    });

    res.json({
      success: true,
      university: universityName,
      totalDistributed: actualTotal,
      perPerson,
      recipientCount: recipients.length,
      recipients: recipients.map(r => ({ userId: r.userId, name: r.name, role: r.role, amount: perPerson })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "sponsor university error");
    res.status(500).json({ error: "Failed to process sponsorship", message: err.message });
  }
});

export default router;
