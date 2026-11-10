import { useAuthStore } from "@/lib/auth";
import { useListSessions, useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar, DollarSign, Users, Clock, Video, ArrowRight, Loader2, BadgeCheck, XCircle, Sparkles, Camera, PenTool, Zap, Layers, Headphones, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TutorFlyerModal from "@/components/TutorFlyerModal";
import { TutorVoiceIntroRecorder } from "@/components/TutorVoiceIntro";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function TutorDashboardPage() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const BASE = getApiUrl();

  const [rate, setRate] = useState("");
  const [savedRate, setSavedRate] = useState<string | null>(null);
  const [savingRate, setSavingRate] = useState(false);
  const [showFlyer, setShowFlyer] = useState(false);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    fetch(`${BASE}/tutors/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.hourlyRate) { setSavedRate(data.hourlyRate); setRate(data.hourlyRate); } })
      .catch(() => {});
  }, []);

  async function saveRate() {
    if (!rate || isNaN(Number(rate))) return;
    setSavingRate(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${BASE}/tutors/me/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hourlyRate: Number(rate) }),
      });
      if (res.ok) {
        setSavedRate(rate);
        toast({ title: "Rate saved!", description: `Your session price is set to ₦${Number(rate).toLocaleString()}` });
      } else {
        let detail = `Server responded ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) detail = body.error;
        } catch {}
        toast({ variant: "destructive", title: "Failed to save rate", description: detail });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to save rate", description: err?.message || "Network error -- check your connection" });
    } finally {
      setSavingRate(false);
    }
  }

  const { data: sessionsData, isLoading: sessionsLoading } = useListSessions({ tutorId: user?.id, limit: 10 });
  const { data: txData } = useListTransactions({ userId: user?.id, limit: 100 });

  const sessions = sessionsData?.sessions ?? [];
  const transactions = txData?.transactions ?? [];
  const totalEarnings = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingSessions = sessions.filter(s => s.status === "pending").length;
  const confirmedSessions = sessions.filter(s => s.status === "confirmed");
  const nextSession = confirmedSessions[0];

  return (
    <DashboardLayout role="tutor" title={`Welcome, ${user?.name?.split(" ")[0] ?? "Tutor"}`}>
      <div className="space-y-6">

        {/* Pending approval banner */}
        {user?.status === "pending" && (
          <div className="glass-panel rounded-2xl p-5 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-yellow-400 font-semibold">Application Under Review</p>
                <p className="text-muted-foreground text-sm">Our team is reviewing your school ID and CGPA. You'll be notified once approved — usually within 24–48 hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected banner */}
        {(user?.status as string) === "rejected" && (
          <div className="glass-panel rounded-2xl p-5 border border-red-500/30 bg-red-500/5">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Application Not Approved</p>
                <p className="text-muted-foreground text-sm mt-0.5">Unfortunately your tutor application was not approved. This may be due to an unclear school ID or CGPA that did not meet our requirements.</p>
                <p className="text-muted-foreground text-sm mt-2">Please contact <span className="text-white">support@2torconnect.com</span> to appeal or re-apply with updated documents.</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Session Banner */}
        {nextSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-accent/80 via-primary to-primary/80 shadow-2xl shadow-primary/30 border border-white/10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Confirmed Session</span>
                </div>
                <h3 className="text-white font-bold text-xl">{nextSession.subject}</h3>
                <p className="text-white/70 text-sm mt-0.5">
                  Student: <strong className="text-white">{nextSession.studentName}</strong> ·{" "}
                  {format(new Date(nextSession.scheduledAt), "MMM d 'at' h:mm a")} · {nextSession.durationMinutes} min
                </p>
              </div>
              <button
                onClick={() => setLocation(`/session/${nextSession.id}`)}
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-primary font-bold hover:bg-white/90 transition-all shadow-lg text-sm"
              >
                <Video className="w-4 h-4" /> Start Session
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Earnings", value: `₦${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
            { label: "Total Sessions", value: sessionsData?.total ?? 0, icon: Calendar, color: "text-accent" },
            { label: "Pending Requests", value: pendingSessions, icon: Clock, color: "text-yellow-400" },
            { label: "Confirmed Sessions", value: confirmedSessions.length, icon: Users, color: "text-blue-400" },
          ].map(stat => (
            <div key={stat.label} className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 bg-white/5 ${stat.color}`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Promote on WhatsApp Status Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-background to-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="text-white font-bold text-sm sm:text-base">Promote Yourself on WhatsApp Status</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Viral
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Generate a high-definition branded campus flyer with your photo, subjects, star rating, and price to post on your WhatsApp status and course group chats.
            </p>
          </div>
          <button
            onClick={() => setShowFlyer(true)}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
          >
            <Camera className="w-4 h-4" /> Generate My Flyer
          </button>
        </div>

        {/* 30-Second Voice Intro Audio Pitch */}
        <TutorVoiceIntroRecorder />

        {/* Tutor Teaching Tools */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            { title: "2torBoard", desc: "Digital Whiteboard", href: "/whiteboard", icon: PenTool, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { title: "Past Questions", desc: "CBT Exam Bank", href: "/past-questions", icon: GraduationCap, color: "text-accent", bg: "bg-accent/10" },
            { title: "2torArena", desc: "Daily Speed Battle", href: "/arena", icon: Zap, color: "text-red-400", bg: "bg-red-500/10" },
            { title: "2torCards", desc: "Flashcard Decks", href: "/flashcards", icon: Layers, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((t) => (
            <div
              key={t.title}
              onClick={() => setLocation(t.href)}
              className="glass-panel p-3.5 sm:p-4 rounded-2xl cursor-pointer hover:border-white/20 transition-all group flex flex-col justify-between"
            >
              <div className={`w-8 h-8 rounded-xl ${t.bg} ${t.color} flex items-center justify-center mb-2`}>
                <t.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-white text-xs font-bold group-hover:text-accent transition-colors">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Set Your Rate */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm sm:text-base">Your Session Price</h2>
              <p className="text-muted-foreground text-xs">Set how much students pay per session</p>
            </div>
            {savedRate && (
              <span className="ml-auto flex items-center gap-1 text-[11px] sm:text-xs text-green-400 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> ₦{Number(savedRate).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">₦</span>
              <input
                type="number"
                min="0"
                value={rate}
                onInput={(e: any) => setRate(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 text-sm"
              />
            </div>
            <button
              onClick={saveRate}
              disabled={savingRate || !rate}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
            >
              {savingRate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Rate"}
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
            <button onClick={() => setLocation("/tutor/sessions")} className="text-sm text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No sessions yet. Students will book once your profile is active.</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-medium text-sm">{s.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[s.status]}`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.studentName} · {format(new Date(s.scheduledAt), "MMM d, h:mm a")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.amount && <span className="text-green-400 font-semibold text-sm">₦{Number(s.amount).toLocaleString()}</span>}
                    {s.status === "confirmed" && (
                      <button
                        onClick={() => setLocation(`/session/${s.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold hover:opacity-90 transition-all"
                      >
                        <Video className="w-3 h-3" /> Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showFlyer && (
        <TutorFlyerModal
          tutor={{
            name: user?.name || "Tutor",
            hourlyRate: savedRate || rate,
            university: (user as any)?.university || "Nigerian University Campus",
          }}
          onClose={() => setShowFlyer(false)}
        />
      )}
    </DashboardLayout>
  );
}
