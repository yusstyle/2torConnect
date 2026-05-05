import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { motion } from "framer-motion";
import { GraduationCap, Search, MapPin, Users, ExternalLink, CheckCircle2, Sparkles, Globe } from "lucide-react";
import { ALL_UNIVERSITIES } from "@/components/UniversityCombobox";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface University {
  name: string; acronym: string; location: string; country: string; type: string;
  established: number | null; website: string | null; color: string;
  studentsCount: number; tutorsCount: number; active: boolean;
}

export default function InvestorUniversities() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"active" | "featured" | "all">("all");
  const [countryFilter, setCountryFilter] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ active: University[]; featured: University[] }>;
    },
    staleTime: 60_000,
  });

  // Supplement with ALL_UNIVERSITIES — any known university not yet in DB or KNOWN_UNIS
  const supplemental: University[] = useMemo(() => {
    const existing = new Set([
      ...(data?.active ?? []).map(u => u.name.toLowerCase()),
      ...(data?.featured ?? []).map(u => u.name.toLowerCase()),
    ]);
    const COLOR_POOL = [
      "from-blue-500 to-cyan-400", "from-purple-500 to-indigo-400", "from-green-500 to-emerald-400",
      "from-red-500 to-orange-400", "from-yellow-500 to-amber-400", "from-teal-500 to-cyan-400",
    ];
    return ALL_UNIVERSITIES
      .filter(name => !existing.has(name.toLowerCase()))
      .map((name, i) => ({
        name, acronym: name.split(" ").filter(w => !["of","the","and","a","an"].includes(w.toLowerCase())).map(w => w[0]).join("").slice(0, 5).toUpperCase(),
        location: "—", country: "Unknown", type: "University",
        established: null, website: null,
        color: COLOR_POOL[i % COLOR_POOL.length],
        studentsCount: 0, tutorsCount: 0, active: false,
      }));
  }, [data?.active?.length, data?.featured?.length]);

  const allList: University[] = filter === "active" ? (data?.active ?? [])
    : filter === "featured" ? [...(data?.featured ?? []), ...supplemental]
    : [...(data?.active ?? []), ...(data?.featured ?? []), ...supplemental];

  const countries = useMemo(() => {
    const set = new Set(allList.map(u => u.country).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [allList.length]);

  const filtered = allList.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
      || u.acronym.toLowerCase().includes(search.toLowerCase())
      || u.country?.toLowerCase().includes(search.toLowerCase());
    const matchCountry = countryFilter === "All" || u.country === countryFilter;
    return matchSearch && matchCountry;
  });

  const totalStudents = (data?.active ?? []).reduce((s, u) => s + u.studentsCount, 0);
  const totalTutors = (data?.active ?? []).reduce((s, u) => s + u.tutorsCount, 0);
  const totalCountries = new Set([...(data?.active ?? []), ...(data?.featured ?? [])].map(u => u.country)).size;

  return (
    <DashboardLayout role="investor" title="Browse Universities">
      <div className="space-y-6">

        {/* Header banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,179,8,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-xl">Universities on 2torConnect</h2>
              <p className="text-white/60 text-sm">Verified universities worldwide where students and tutors are registered. Sponsor learners and educators globally.</p>
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-4 gap-3">
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{data?.active?.length ?? 0}</p>
              <p className="text-xs text-white/60 mt-0.5">Active</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalStudents}</p>
              <p className="text-xs text-white/60 mt-0.5">Students</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalTutors}</p>
              <p className="text-xs text-white/60 mt-0.5">Tutors</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-accent">{totalCountries || "—"}</p>
              <p className="text-xs text-white/60 mt-0.5">Countries</p>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, acronym, or country…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>

          {/* Member filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All Universities", count: (data?.active?.length ?? 0) + (data?.featured?.length ?? 0) },
              { key: "active", label: "With Members", count: data?.active?.length ?? 0 },
              { key: "featured", label: "Awaiting Members", count: data?.featured?.length ?? 0 },
            ].map(t => (
              <button key={t.key} onClick={() => setFilter(t.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === t.key ? "bg-yellow-500 text-black" : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"}`}>
                {t.label} <span className="opacity-60">· {t.count}</span>
              </button>
            ))}
          </div>

          {/* Country filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex gap-2 flex-wrap">
              {countries.map(c => (
                <button key={c} onClick={() => setCountryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${countryFilter === c ? "bg-accent/20 text-accent border border-accent/30" : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl h-56 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-bold mb-1">No universities found</p>
            <p className="text-muted-foreground text-sm">Try a different search or filter</p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">{filtered.length} universit{filtered.length !== 1 ? "ies" : "y"}{countryFilter !== "All" ? ` in ${countryFilter}` : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((uni, i) => (
                <motion.div key={uni.name + i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.03 }}
                  className={`glass-panel rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all group ${uni.active ? "ring-1 ring-yellow-500/20" : ""}`}>
                  <div className={`h-2 bg-gradient-to-r ${uni.color}`} />
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${uni.color} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-lg`}>
                        {uni.acronym.slice(0, 4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                          <p className="text-white font-bold text-sm leading-tight flex-1">{uni.name}</p>
                          {uni.active && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground text-xs">{uni.location}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-accent/80 text-xs font-medium">{uni.country}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${uni.type === "Private" ? "bg-purple-500/20 text-purple-400" : uni.type === "State" ? "bg-blue-500/20 text-blue-400" : uni.type === "Public" ? "bg-green-500/20 text-green-400" : uni.type === "Federal" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"}`}>
                            {uni.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className={`font-bold text-sm ${uni.studentsCount > 0 ? "text-accent" : "text-white"}`}>{uni.studentsCount}</p>
                        <p className="text-muted-foreground text-[10px]">Students</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className={`font-bold text-sm ${uni.tutorsCount > 0 ? "text-primary" : "text-white"}`}>{uni.tutorsCount}</p>
                        <p className="text-muted-foreground text-[10px]">Tutors</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className="text-white font-bold text-sm">{uni.established ?? "—"}</p>
                        <p className="text-muted-foreground text-[10px]">Est.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {uni.active ? (
                        <Link href={`/investor/students?university=${encodeURIComponent(uni.name)}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white text-xs font-bold hover:opacity-90 transition-all">
                          <Users className="w-3.5 h-3.5" /> View Members
                        </Link>
                      ) : (
                        <button disabled
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-muted-foreground text-xs font-medium cursor-not-allowed">
                          <Sparkles className="w-3.5 h-3.5" /> Awaiting members
                        </button>
                      )}
                      {uni.website && (
                        <a href={uni.website} target="_blank" rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
