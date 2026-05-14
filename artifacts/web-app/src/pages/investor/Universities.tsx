import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Search, MapPin, Users, ExternalLink, CheckCircle2,
  Sparkles, Globe, Trophy, Star, X, ChevronRight, BookOpen, ArrowLeft, Map
} from "lucide-react";
import { ALL_UNIVERSITIES } from "@/components/UniversityCombobox";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface University {
  name: string; acronym: string; location: string; country: string; type: string;
  established: number | null; website: string | null; color: string;
  studentsCount: number; tutorsCount: number; active: boolean;
}

interface Performer {
  userId: number; name: string; email: string; avatarUrl?: string | null;
  status: string; role: string; sessionCount: number;
  subjects?: string[] | null; aboutYou?: string | null;
}

export default function SponsorUniversities() {
  const { token } = useAuthStore();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"active" | "featured" | "all">("all");
  const [countryFilter, setCountryFilter] = useState("All");
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ active: University[]; featured: University[] }>;
    },
    staleTime: 60_000,
  });

  const { data: performers, isLoading: loadingPerformers } = useQuery({
    queryKey: ["top-performers", selectedUni?.name],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities/top-performers/${encodeURIComponent(selectedUni!.name)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ university: string; topStudents: Performer[]; topTutors: Performer[] }>;
    },
    enabled: !!selectedUni,
    staleTime: 30_000,
  });

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

  if (selectedUni) {
    const topStudents = performers?.topStudents ?? [];
    const topTutors = performers?.topTutors ?? [];
    const allPerformers = [...topStudents.map(p => ({ ...p, role: "student" })), ...topTutors.map(p => ({ ...p, role: "tutor" }))];

    return (
      <DashboardLayout role="investor" title="Sponsor a University">
        <div className="space-y-6">
          <button onClick={() => setSelectedUni(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to universities
          </button>

          {/* University header */}
          <div className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${selectedUni.color.replace("from-", "from-").replace("to-", "to-")} bg-opacity-10 border border-white/10`}>
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-yellow-500 to-orange-400" />
            <div className="relative flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedUni.color} flex items-center justify-center font-bold text-white text-sm shadow-xl`}>
                {selectedUni.acronym.slice(0, 4)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-2xl">{selectedUni.name}</h2>
                  {selectedUni.active && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-white/60">
                  <MapPin className="w-3.5 h-3.5" /><span>{selectedUni.location}</span>
                  <span>·</span><span>{selectedUni.country}</span>
                  <span>·</span><span>{selectedUni.type}</span>
                  {selectedUni.established && <><span>·</span><span>Est. {selectedUni.established}</span></>}
                </div>
              </div>
              {selectedUni.website && (
                <a href={selectedUni.website} target="_blank" rel="noreferrer"
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/20 p-3 text-center">
                <p className="text-2xl font-bold text-accent">{selectedUni.studentsCount}</p>
                <p className="text-xs text-white/60 mt-0.5">Active Students</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-3 text-center">
                <p className="text-2xl font-bold text-primary">{selectedUni.tutorsCount}</p>
                <p className="text-xs text-white/60 mt-0.5">Active Tutors</p>
              </div>
            </div>
          </div>

          {/* How funds are distributed */}
          <div className="glass-panel rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 font-bold text-sm">Automated Distribution</p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              When you sponsor this university, our system automatically identifies the <strong className="text-white">top 10 most active students</strong> and <strong className="text-white">top 10 most active tutors</strong> based on session activity. Your funds are split equally among them — no manual selection required.
            </p>
          </div>

          {/* Top performers */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold text-lg">Top Performers at {selectedUni.name}</h3>
            </div>

            {loadingPerformers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-panel rounded-2xl h-24 animate-pulse bg-white/5" />
                ))}
              </div>
            ) : allPerformers.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-white font-bold mb-1">No members yet at this university</p>
                <p className="text-muted-foreground text-sm">As students and tutors register and become active, they'll appear here for automated sponsorship.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topStudents.length > 0 && (
                  <div>
                    <p className="text-accent font-semibold text-sm mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Top {topStudents.length} Students
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {topStudents.map((p, i) => (
                        <PerformerCard key={p.userId} performer={p} rank={i + 1} color="from-accent to-primary" />
                      ))}
                    </div>
                  </div>
                )}
                {topTutors.length > 0 && (
                  <div>
                    <p className="text-primary font-semibold text-sm mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Top {topTutors.length} Tutors
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {topTutors.map((p, i) => (
                        <PerformerCard key={p.userId} performer={p} rank={i + 1} color="from-primary to-purple-500" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sponsor CTA */}
          <div className="glass-panel rounded-2xl p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
            <h3 className="text-white font-bold text-lg mb-2">Ready to Sponsor {selectedUni.name}?</h3>
            <p className="text-white/60 text-sm mb-4">Your contribution will be distributed automatically to the most active students and tutors above.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLocation(`/university/${encodeURIComponent(selectedUni.name)}`)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/15 transition-all text-sm">
                <Map className="w-4 h-4" /> View Campus
              </button>
              <button
                onClick={() => alert("Payment integration coming soon — contact us to sponsor directly.")}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2">
                <Star className="w-5 h-5" /> Sponsor This University
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="investor" title="Sponsor a University">
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
              <p className="text-white/60 text-sm">Select a university to sponsor. Our system will automatically identify and pay the top 10 most active students and tutors.</p>
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
                  className={`glass-panel rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all group cursor-pointer ${uni.active ? "ring-1 ring-yellow-500/20" : ""}`}
                  onClick={() => setSelectedUni(uni)}>
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
                      <button
                        onClick={e => { e.stopPropagation(); setLocation(`/university/${encodeURIComponent(uni.name)}`); }}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/8 text-muted-foreground hover:bg-white/15 hover:text-white transition-all">
                        <Map className="w-3.5 h-3.5" /> Campus
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${uni.active
                          ? "bg-gradient-to-r from-yellow-500 to-orange-400 text-white hover:opacity-90"
                          : "bg-white/5 text-muted-foreground"}`}>
                        {uni.active
                          ? <><Trophy className="w-3.5 h-3.5" /> Sponsor</>
                          : <><Sparkles className="w-3.5 h-3.5" /> Awaiting</>}
                      </button>
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

function PerformerCard({ performer, rank, color }: { performer: Performer; rank: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.04 }}
      className="glass-panel rounded-xl p-4 flex items-center gap-3">
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${color} flex items-center justify-center font-bold text-white text-sm overflow-hidden`}>
          {performer.avatarUrl
            ? <img src={performer.avatarUrl} alt={performer.name} className="w-full h-full object-cover" />
            : performer.name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[9px] font-bold text-black">
          #{rank}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{performer.name}</p>
        <p className="text-muted-foreground text-xs truncate">{performer.email}</p>
        {performer.subjects && performer.subjects.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {performer.subjects.slice(0, 2).map(s => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{s}</span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-yellow-400 font-bold text-sm">{performer.sessionCount}</p>
        <p className="text-muted-foreground text-[10px]">sessions</p>
      </div>
    </motion.div>
  );
}
