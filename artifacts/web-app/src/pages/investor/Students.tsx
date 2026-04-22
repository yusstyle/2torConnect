import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, Users, GraduationCap, MessageSquare, BookOpen, CheckCircle, Clock, Video, HandCoins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400 bg-green-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  suspended: "text-red-400 bg-red-400/10",
};

interface RealUser {
  id: number; name: string; email: string; status: string; role: string;
  avatarUrl?: string | null; university?: string | null; level?: string | null; subjects?: string[] | null;
}

export default function InvestorStudents() {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("All Universities");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const u = sp.get("university");
    if (u) setUniversityFilter(u);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["investor-students", search],
    queryFn: async () => {
      const params = new URLSearchParams({ role: "student", limit: "50", status: "active" });
      if (search) params.set("search", search);
      const res = await fetch(`${BASE}/api/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load students");
      return res.json() as Promise<{ users: RealUser[] }>;
    },
    staleTime: 30_000,
  });

  const students = data?.users ?? [];
  const universities = ["All Universities", ...Array.from(new Set(students.map(s => s.university).filter(Boolean) as string[]))];
  const filtered = students.filter(s => universityFilter === "All Universities" || s.university === universityFilter);

  const startSponsorCall = (target: RealUser) => {
    if (!user) return;
    const room = `sponsor-${user.id}-${target.id}-${Date.now()}`;
    toast({ title: `Connecting with ${target.name}…`, description: "Opening video room" });
    setLocation(`/session/${room}`);
  };

  const sponsor = (target: RealUser) => {
    toast({
      title: `Ready to sponsor ${target.name}?`,
      description: "Payment integration coming soon — for now, start a video call to discuss directly.",
    });
  };

  return (
    <DashboardLayout role="investor" title="Find Students to Sponsor">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-accent/20 via-accent/5 to-primary/10 border border-accent/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,212,255,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Real Students. Real Impact.</h2>
              <p className="text-white/60 text-sm">Connect via video call, mentor, and fund students directly.</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <select value={universityFilter} onChange={e => setUniversityFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50">
            {universities.map(u => <option key={u} value={u} className="bg-background">{u}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl h-60 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-bold mb-1">No students yet</p>
            <p className="text-muted-foreground text-sm">{universityFilter !== "All Universities" ? `No registered students at ${universityFilter} yet` : "No students match your search"}</p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student, i) => (
                <motion.div key={student.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-panel rounded-2xl p-5 hover:border-accent/30 transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center font-bold text-white text-lg shrink-0 overflow-hidden">
                      {student.avatarUrl
                        ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                        : <span>{student.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{student.name}</p>
                      <p className="text-muted-foreground text-xs truncate">{student.email}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${STATUS_COLORS[student.status] ?? "text-muted-foreground bg-white/5"}`}>
                        {student.status === "active" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {student.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 min-h-[44px]">
                    {student.university ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate">{student.university}{student.level ? ` · ${student.level}` : ""}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/50 italic">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        <span>University not specified</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => startSponsorCall(student)} title="Start video call"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 text-xs font-bold transition-all">
                      <Video className="w-3.5 h-3.5" /> Call
                    </button>
                    <button onClick={() => setLocation("/messages")}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-medium transition-all">
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                    <button onClick={() => sponsor(student)} title="Sponsor this student"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white text-xs font-bold hover:opacity-90 transition-all">
                      <HandCoins className="w-3.5 h-3.5" /> Fund
                    </button>
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
