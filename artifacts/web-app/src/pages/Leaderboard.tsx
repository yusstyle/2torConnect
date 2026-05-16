import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { Trophy, Star, BookOpen, Medal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface TutorEntry { userId: number; name: string; avatarUrl?: string; university?: string; subjects?: string[]; rating?: string; totalSessions?: number; hourlyRate?: string; }
interface StudentEntry { studentId: number; name: string; avatarUrl?: string; sessionCount: number; }

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { user, token } = useAuthStore();
  const [tab, setTab] = useState<"tutors" | "students">("tutors");
  const [tutors, setTutors] = useState<TutorEntry[]>([]);
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tRes, sRes] = await Promise.all([
          fetch(`${API}/leaderboard/tutors`, { headers }),
          fetch(`${API}/leaderboard/students`, { headers }),
        ]);
        setTutors(await tRes.json());
        setStudents(await sRes.json());
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const role = user?.role === "tutor" ? "tutor" : user?.role === "investor" ? "investor" : "student";

  return (
    <DashboardLayout role={role} title="Leaderboard">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">2torConnect Leaderboard</h2>
          <p className="text-muted-foreground text-sm">Top performers across the platform</p>
        </div>

        <div className="flex gap-2 mb-6 glass-panel p-1 rounded-2xl">
          <button
            onClick={() => setTab("tutors")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "tutors" ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
          >
            Top Tutors
          </button>
          <button
            onClick={() => setTab("students")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "students" ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
          >
            Active Students
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : tab === "tutors" ? (
          <div className="space-y-3">
            {tutors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No tutors yet</div>
            ) : tutors.map((t, i) => (
              <motion.div
                key={t.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-panel rounded-2xl p-4 flex items-center gap-4 ${i < 3 ? "border-yellow-500/20" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-300" :
                  i === 2 ? "bg-orange-500/20 text-orange-400" :
                  "bg-white/10 text-muted-foreground"
                }`}>
                  {i < 3 ? MEDALS[i] : i + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                  {t.avatarUrl ? <img src={t.avatarUrl} className="w-full h-full object-cover" /> : t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{t.name}</p>
                  <p className="text-muted-foreground text-xs truncate">{t.university || "University Student"}</p>
                  {(t.subjects?.length ?? 0) > 0 && (
                    <p className="text-accent text-xs truncate">{t.subjects?.slice(0, 3).join(" · ")}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" /> {t.rating ?? "New"}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <BookOpen className="w-3 h-3" /> {t.totalSessions ?? 0} sessions
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No student data yet</div>
            ) : students.map((s, i) => (
              <motion.div
                key={s.studentId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-panel rounded-2xl p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-300" :
                  i === 2 ? "bg-orange-500/20 text-orange-400" :
                  "bg-white/10 text-muted-foreground"
                }`}>
                  {i < 3 ? MEDALS[i] : i + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                  {s.avatarUrl ? <img src={s.avatarUrl} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{s.name}</p>
                </div>
                <div className="flex items-center gap-1 text-accent font-bold text-sm shrink-0">
                  <BookOpen className="w-3.5 h-3.5" /> {s.sessionCount} sessions
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
