import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { motion } from "framer-motion";
import { GraduationCap, Search, MapPin, Users, BookOpen, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface University {
  name: string; acronym: string; state: string; type: string;
  established: number | null; website: string | null; color: string;
  studentsCount: number; tutorsCount: number; active: boolean;
}

export default function InvestorUniversities() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"active" | "featured" | "all">("active");

  const { data, isLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ active: University[]; featured: University[] }>;
    },
    staleTime: 60_000,
  });

  const list: University[] = filter === "active" ? (data?.active ?? [])
    : filter === "featured" ? (data?.featured ?? [])
    : [...(data?.active ?? []), ...(data?.featured ?? [])];

  const filtered = list.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.acronym.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="investor" title="Browse Universities">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,179,8,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-xl">Universities on 2torConnect</h2>
              <p className="text-white/60 text-sm">Real universities where students and tutors are registered. Sponsor learners and educators directly.</p>
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{data?.active?.length ?? 0}</p>
              <p className="text-xs text-white/60 mt-0.5">Active</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-white">{(data?.active ?? []).reduce((s, u) => s + u.studentsCount, 0)}</p>
              <p className="text-xs text-white/60 mt-0.5">Students</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-white">{(data?.active ?? []).reduce((s, u) => s + u.tutorsCount, 0)}</p>
              <p className="text-xs text-white/60 mt-0.5">Tutors</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or acronym…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "active", label: "With Members", count: data?.active?.length ?? 0 },
              { key: "featured", label: "Other Top Unis", count: data?.featured?.length ?? 0 },
              { key: "all", label: "All", count: (data?.active?.length ?? 0) + (data?.featured?.length ?? 0) },
            ].map(t => (
              <button key={t.key} onClick={() => setFilter(t.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === t.key ? "bg-yellow-500 text-black" : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"}`}>
                {t.label} <span className="opacity-60">· {t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            <p className="text-muted-foreground text-sm">{filtered.length} universit{filtered.length !== 1 ? "ies" : "y"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((uni, i) => (
                <motion.div key={uni.name + i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
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
                          <span className="text-muted-foreground text-xs">{uni.state}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${uni.type === "Private" ? "bg-purple-500/20 text-purple-400" : uni.type === "State" ? "bg-blue-500/20 text-blue-400" : uni.type === "Federal" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"}`}>
                            {uni.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className={`text-white font-bold text-sm ${uni.studentsCount > 0 ? "text-accent" : ""}`}>{uni.studentsCount}</p>
                        <p className="text-muted-foreground text-[10px]">Students</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-white/5">
                        <p className={`text-white font-bold text-sm ${uni.tutorsCount > 0 ? "text-primary" : ""}`}>{uni.tutorsCount}</p>
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
