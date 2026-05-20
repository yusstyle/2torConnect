import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  GraduationCap, Search, MapPin, Users, ExternalLink, CheckCircle2,
  Sparkles, Globe, Trophy, Star, BookOpen, ArrowLeft, Map, Loader2,
  X, Zap, UserCheck, BookMarked
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const COLOR_POOL = [
  "from-blue-500 to-cyan-400", "from-purple-500 to-indigo-400", "from-green-500 to-emerald-400",
  "from-red-500 to-orange-400", "from-yellow-500 to-amber-400", "from-teal-500 to-cyan-400",
  "from-pink-500 to-rose-400", "from-violet-500 to-purple-400", "from-sky-500 to-blue-400",
  "from-lime-500 to-green-400", "from-orange-500 to-red-400", "from-cyan-500 to-sky-400",
];

function makeAcronym(name: string) {
  return name.split(" ")
    .filter(w => !["of", "the", "and", "a", "an", "for", "in", "at", "de", "la", "le"].includes(w.toLowerCase()))
    .map(w => w[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return COLOR_POOL[Math.abs(h) % COLOR_POOL.length];
}

interface PlatformUni {
  name: string; acronym: string; location: string; country: string; type: string;
  established: number | null; website: string | null; color: string;
  studentsCount: number; tutorsCount: number; active: boolean;
}

interface HipolabsResult {
  name: string; country: string; domain: string | null;
}

interface UniCard {
  name: string; acronym: string; location: string; country: string; type: string;
  established: number | null; website: string | null; color: string;
  studentsCount: number; tutorsCount: number; active: boolean;
  fromSearch?: boolean;
}

interface Performer {
  userId: number; name: string; email: string; avatarUrl?: string | null;
  status: string; role: string; sessionCount: number;
  subjects?: string[] | null; aboutYou?: string | null;
}

export default function SponsorUniversities() {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUni, setSelectedUni] = useState<UniCard | null>(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [splitBetween, setSplitBetween] = useState<"both" | "students" | "tutors">("both");
  const [sponsoring, setSponsoring] = useState(false);
  const [sponsorResult, setSponsorResult] = useState<null | { totalDistributed: number; perPerson: number; recipientCount: number; recipients: Array<{ name: string; role: string; amount: number }> }>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: platformData, isLoading: platformLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ active: PlatformUni[]; featured: PlatformUni[] }>;
    },
    staleTime: 60_000,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["uni-world-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { universities: [] };
      const res = await fetch(`${BASE}/api/universities/search?q=${encodeURIComponent(debouncedSearch)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { universities: [] };
      return res.json() as Promise<{ universities: HipolabsResult[] }>;
    },
    enabled: debouncedSearch.length >= 2,
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

  const handleSponsor = async () => {
    if (!selectedUni || !sponsorAmount) return;
    const amount = Number(sponsorAmount);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    setSponsoring(true);
    try {
      const res = await fetch(`${BASE}/api/universities/sponsor`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ universityName: selectedUni.name, amount, splitBetween }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sponsorship failed");
      setSponsorResult(data);
      toast({ title: "Sponsorship sent!", description: `₦${data.totalDistributed.toLocaleString()} distributed to ${data.recipientCount} users` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to sponsor", description: e.message });
    } finally { setSponsoring(false); }
  };

  const platformActive = platformData?.active ?? [];
  const platformFeatured = platformData?.featured ?? [];
  const platformAll = [...platformActive, ...platformFeatured];

  const platformNames = useMemo(() => new Set(platformAll.map(u => u.name.toLowerCase())), [platformAll.length]);

  const totalStudents = platformActive.reduce((s, u) => s + u.studentsCount, 0);
  const totalTutors = platformActive.reduce((s, u) => s + u.tutorsCount, 0);

  const isSearching = debouncedSearch.length >= 2;

  const displayList: UniCard[] = useMemo(() => {
    if (!isSearching) {
      return platformAll;
    }

    const lq = debouncedSearch.toLowerCase();

    const platformMatches: UniCard[] = platformAll.filter(u =>
      u.name.toLowerCase().includes(lq) ||
      u.acronym?.toLowerCase().includes(lq) ||
      u.country?.toLowerCase().includes(lq)
    );

    const worldResults: UniCard[] = (searchData?.universities ?? [])
      .filter(u => !platformNames.has(u.name.toLowerCase()))
      .map((u, i) => ({
        name: u.name,
        acronym: makeAcronym(u.name),
        location: u.domain ?? "—",
        country: u.country,
        type: "University",
        established: null,
        website: u.domain ? `https://${u.domain}` : null,
        color: colorFor(u.name),
        studentsCount: 0,
        tutorsCount: 0,
        active: false,
        fromSearch: true,
      }));

    return [...platformMatches, ...worldResults];
  }, [isSearching, debouncedSearch, platformAll.length, searchData?.universities?.length, platformNames]);

  if (selectedUni) {
    const topStudents = performers?.topStudents ?? [];
    const topTutors = performers?.topTutors ?? [];

    return (
      <DashboardLayout role="investor" title="Sponsor a University">
        <div className="space-y-6">
          <button onClick={() => setSelectedUni(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to universities
          </button>

          <div className={`relative overflow-hidden rounded-3xl p-6 border border-white/10`}>
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${selectedUni.color}`} />
            <div className="relative flex items-start gap-4">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${selectedUni.color} flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-xl shrink-0`}>
                {selectedUni.acronym.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h2 className="text-white font-bold text-lg sm:text-2xl leading-tight break-words">{selectedUni.name}</h2>
                  {selectedUni.active && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0 mt-1" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs sm:text-sm text-white/60">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>{selectedUni.location !== "—" ? selectedUni.location : selectedUni.country}</span>
                  {selectedUni.country && selectedUni.location !== selectedUni.country && <><span>·</span><span>{selectedUni.country}</span></>}
                  <span>·</span><span>{selectedUni.type}</span>
                  {selectedUni.established && <><span>·</span><span>Est. {selectedUni.established}</span></>}
                </div>
                {selectedUni.website && (
                  <a href={selectedUni.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-white/50 hover:text-white transition-colors">
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
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

          <div className="glass-panel rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 font-bold text-sm">Automated Distribution</p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              When you sponsor this university, our system automatically identifies the <strong className="text-white">top 10 most active students</strong> and <strong className="text-white">top 10 most active tutors</strong> based on session activity. Your funds are split equally among them — no manual selection required.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold text-lg">Top Performers at {selectedUni.name}</h3>
            </div>
            {loadingPerformers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-panel rounded-2xl h-24 animate-pulse bg-white/5" />)}
              </div>
            ) : topStudents.length === 0 && topTutors.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-white font-bold mb-1">No members yet at this university</p>
                <p className="text-muted-foreground text-sm">As students and tutors register and become active, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topStudents.length > 0 && (
                  <div>
                    <p className="text-accent font-semibold text-sm mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Top {topStudents.length} Students
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {topStudents.map((p, i) => <PerformerCard key={p.userId} performer={p} rank={i + 1} color="from-accent to-primary" />)}
                    </div>
                  </div>
                )}
                {topTutors.length > 0 && (
                  <div>
                    <p className="text-primary font-semibold text-sm mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Top {topTutors.length} Tutors
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {topTutors.map((p, i) => <PerformerCard key={p.userId} performer={p} rank={i + 1} color="from-primary to-purple-500" />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
            <h3 className="text-white font-bold text-lg mb-2">Ready to Sponsor {selectedUni.name}?</h3>
            <p className="text-white/60 text-sm mb-4">Your contribution will be distributed automatically to the most active students and tutors.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLocation(`/university/${encodeURIComponent(selectedUni.name)}`)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/15 transition-all text-sm">
                <Map className="w-4 h-4" /> View Campus
              </button>
              <button
                onClick={() => { setSponsorAmount(""); setSplitBetween("both"); setSponsorResult(null); setShowSponsorModal(true); }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2">
                <Star className="w-5 h-5" /> Sponsor This University
              </button>
            </div>
          </div>
        </div>

        {/* Sponsorship Modal */}
        {showSponsorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !sponsoring && setShowSponsorModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#0f1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {sponsorResult ? (
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-white font-bold text-lg">Sponsorship Sent!</h3>
                    </div>
                    <button onClick={() => setShowSponsorModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">₦{sponsorResult.totalDistributed.toLocaleString()}</p>
                    <p className="text-green-400 text-sm mt-1">distributed to {sponsorResult.recipientCount} users</p>
                    <p className="text-muted-foreground text-xs mt-1">₦{sponsorResult.perPerson.toLocaleString()} each</p>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {sponsorResult.recipients.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.role === "student" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{r.name}</p>
                          <p className="text-muted-foreground text-xs capitalize">{r.role}</p>
                        </div>
                        <p className="text-green-400 text-sm font-bold shrink-0">+₦{r.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowSponsorModal(false)} className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all">
                    Done
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">Sponsor {selectedUni.name}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5">Funds go directly to active students & tutors</p>
                    </div>
                    <button onClick={() => setShowSponsorModal(false)} disabled={sponsoring} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Amount (₦)</label>
                    <input
                      type="number"
                      value={sponsorAmount}
                      onChange={e => setSponsorAmount(e.target.value)}
                      placeholder="e.g. 100000"
                      min="1000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground placeholder:font-normal"
                    />
                    <div className="flex gap-2 mt-2">
                      {[10000, 50000, 100000, 500000].map(v => (
                        <button key={v} onClick={() => setSponsorAmount(String(v))} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/10 hover:text-yellow-400 text-muted-foreground text-xs font-medium transition-all">
                          ₦{(v / 1000)}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Distribute to</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: "both", label: "Everyone", icon: Users },
                        { key: "students", label: "Students", icon: UserCheck },
                        { key: "tutors", label: "Tutors", icon: BookMarked },
                      ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setSplitBetween(key)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all ${splitBetween === key ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-400" : "border-white/10 bg-white/5 text-muted-foreground hover:border-yellow-500/30"}`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sponsorAmount && Number(sponsorAmount) > 0 && (
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Distribution preview</p>
                      {loadingPerformers ? (
                        <p className="text-white/40 text-sm">Loading performers…</p>
                      ) : (() => {
                        const students = splitBetween === "tutors" ? [] : (performers?.topStudents ?? []);
                        const tutors = splitBetween === "students" ? [] : (performers?.topTutors ?? []);
                        const total = students.length + tutors.length;
                        const each = total > 0 ? Math.floor((Number(sponsorAmount) / total) * 100) / 100 : 0;
                        return total === 0 ? (
                          <p className="text-yellow-400 text-sm">No active users found — consider choosing a different group</p>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-bold">{total} recipients</p>
                              <p className="text-muted-foreground text-xs">{students.length} student{students.length !== 1 ? "s" : ""} · {tutors.length} tutor{tutors.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold">₦{each.toLocaleString()} each</p>
                              <p className="text-muted-foreground text-xs">Total ₦{(each * total).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <button
                    onClick={handleSponsor}
                    disabled={sponsoring || !sponsorAmount || Number(sponsorAmount) <= 0}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {sponsoring ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</> : <><Zap className="w-5 h-5" /> Confirm & Distribute</>}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">Funds are credited instantly to each recipient's wallet</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
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
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg shrink-0">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-base sm:text-xl leading-snug">Sponsor Any University in the World</h2>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">Search 9,000+ universities. Our system automatically pays the top 10 active students and tutors you choose.</p>
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{platformActive.length}</p>
              <p className="text-xs text-white/60 mt-0.5">On Platform</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalStudents}</p>
              <p className="text-xs text-white/60 mt-0.5">Students</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-accent">{totalTutors}</p>
              <p className="text-xs text-white/60 mt-0.5">Tutors</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            {searchLoading && debouncedSearch.length >= 2 && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search any university in the world — e.g. Harvard, Unilag, Oxford, IIT…"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>
          {isSearching && (
            <p className="text-xs text-muted-foreground mt-2 pl-1">
              {searchLoading ? "Searching worldwide universities…" : `${displayList.length} result${displayList.length !== 1 ? "s" : ""} found`}
            </p>
          )}
          {!isSearching && (
            <p className="text-xs text-muted-foreground mt-2 pl-1 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Showing {platformAll.length} universities on the platform — search to find any of 9,000+ worldwide
            </p>
          )}
        </div>

        {/* Results */}
        {platformLoading && !isSearching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl h-52 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : displayList.length === 0 && isSearching && !searchLoading ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-bold mb-1">No universities found for "{search}"</p>
            <p className="text-muted-foreground text-sm">Try a different name or spelling</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map((uni, i) => (
              <motion.div
                key={uni.name + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03 }}
                className={`glass-panel rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all group cursor-pointer ${uni.active ? "ring-1 ring-yellow-500/20" : ""}`}
                onClick={() => setSelectedUni(uni)}
              >
                <div className={`h-1.5 bg-gradient-to-r ${uni.color}`} />
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
                        <span className="text-accent/80 text-xs font-medium">{uni.country}</span>
                        {uni.type && uni.type !== "University" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            uni.type === "Private" ? "bg-purple-500/20 text-purple-400"
                            : uni.type === "State" ? "bg-blue-500/20 text-blue-400"
                            : uni.type === "Public" ? "bg-green-500/20 text-green-400"
                            : uni.type === "Federal" ? "bg-green-500/20 text-green-400"
                            : "bg-white/10 text-white/50"}`}>
                            {uni.type}
                          </span>
                        )}
                        {uni.fromSearch && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">worldwide</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-xl bg-white/5">
                      <p className={`font-bold text-sm ${uni.studentsCount > 0 ? "text-accent" : "text-white/40"}`}>{uni.studentsCount}</p>
                      <p className="text-muted-foreground text-[10px]">Students</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white/5">
                      <p className={`font-bold text-sm ${uni.tutorsCount > 0 ? "text-primary" : "text-white/40"}`}>{uni.tutorsCount}</p>
                      <p className="text-muted-foreground text-[10px]">Tutors</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white/5">
                      <p className="text-white/50 font-bold text-sm">{uni.established ?? "—"}</p>
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
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        uni.active
                          ? "bg-gradient-to-r from-yellow-500 to-orange-400 text-white hover:opacity-90"
                          : "bg-white/5 text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-400"
                      }`}>
                      {uni.active
                        ? <><Trophy className="w-3.5 h-3.5" /> Sponsor</>
                        : <><Star className="w-3.5 h-3.5" /> Sponsor</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* World search prompt when no search yet */}
        {!isSearching && !platformLoading && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 text-center">
            <Globe className="w-10 h-10 text-accent/50 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Find any university in the world</p>
            <p className="text-muted-foreground text-sm">Type in the search box above to discover 9,000+ universities from every country — Harvard, Oxford, UniLag, IIT, and more.</p>
          </div>
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
