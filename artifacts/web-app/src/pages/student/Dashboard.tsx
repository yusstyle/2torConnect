import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useListSessions, useListTransactions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  BookOpen, Clock, CheckCircle2, Video, ArrowRight, Loader2,
  Zap, Layers, PenTool, Headphones, GraduationCap, Calculator,
  Sparkles, Flame, Smartphone, Eye, EyeOff, Plus, Search, Wallet,
  ChevronRight, Users2, Trophy, Gift, Calendar
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import InstallAppModal from "@/components/InstallAppModal";

function getCountdownText(scheduledAt: string | Date): string {
  const diffMs = new Date(scheduledAt).getTime() - Date.now();
  if (diffMs <= 0 && diffMs > -3600000) return "Live Now";
  if (diffMs <= 0) return "Passed";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 1) return `⏱️ 00:${minutes.toString().padStart(2, "0")}:00`;
  if (hours < 24) return `⏱️ ${hours}h ${minutes}m`;
  return format(new Date(scheduledAt), "MMM d");
}

export default function StudentDashboard() {
  const { user, token } = useAuthStore();
  const [, setLocation] = useLocation();
  const [showInstallApp, setShowInstallApp] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAcademics, setShowAcademics] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/groups/my-invitations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setPendingInvitesCount(d.length);
      })
      .catch(() => {});
  }, [token]);

  const { data: sessionsData, isLoading: sessionsLoading } = useListSessions({ studentId: user?.id, limit: 30 });
  const { data: txData } = useListTransactions({ userId: user?.id, limit: 100 });

  const allSessions = sessionsData?.sessions || [];
  const confirmedSessions = allSessions.filter(s => s.status === "confirmed");
  const completedSessions = allSessions.filter(s => s.status === "completed");
  const nextSession = confirmedSessions[0];

  const transactions = txData?.transactions ?? [];
  const completedTx = transactions.filter((t) => t.status === "completed");
  const totalFunded = completedTx.filter((t) => t.type === "bonus").reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = completedTx.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const balance = Math.max(0, totalFunded - totalSpent);

  // 7-day strip for current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Sessions on the selected day
  const sessionsOnSelectedDay = allSessions.filter(s => isSameDay(new Date(s.scheduledAt), selectedDay));

  return (
    <DashboardLayout role="student">
      <div className="space-y-4 max-w-4xl mx-auto">

        {/* ── 1. Top Dual Balance & Academic Cards (OPay structure) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Available Wallet */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-950/20 flex flex-col justify-between min-h-[125px] sm:min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                  <span>Available</span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-0.5 hover:text-white transition-colors"
                    aria-label="Toggle balance visibility"
                  >
                    {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => setLocation("/student/wallet")}
                  className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold tracking-wide transition-colors flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" /> Add
                </button>
              </div>

              <div
                onClick={() => setLocation("/student/wallet")}
                className="cursor-pointer group flex items-center gap-1 mt-1"
              >
                <p className="text-xl sm:text-2xl font-black tracking-tight">
                  {showBalance ? `₦${balance.toLocaleString()}` : "****"}
                </p>
                <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-100/90 font-medium">
              <span>Spent {showBalance ? `₦${totalSpent.toLocaleString()}` : "****"}</span>
            </div>
            {/* Soft decorative glow */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Academic Standing */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-teal-700 via-teal-800 to-cyan-900 text-white shadow-lg shadow-teal-950/20 flex flex-col justify-between min-h-[125px] sm:min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 text-xs text-teal-100 font-medium">
                  <span>Academics</span>
                  <button
                    onClick={() => setShowAcademics(!showAcademics)}
                    className="p-0.5 hover:text-white transition-colors"
                    aria-label="Toggle academics visibility"
                  >
                    {showAcademics ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold">
                  5.0 GPA
                </span>
              </div>

              <div
                onClick={() => setLocation("/student/sessions")}
                className="cursor-pointer group flex items-center gap-1 mt-1"
              >
                <p className="text-xl sm:text-2xl font-black tracking-tight">
                  {showAcademics ? `${confirmedSessions.length} Booked` : "****"}
                </p>
                <ChevronRight className="w-4 h-4 text-teal-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-teal-100/90 font-medium">
              <span>{completedSessions.length} Completed</span>
              <span className="text-cyan-200 font-bold">Active</span>
            </div>
            {/* Soft decorative glow */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>
        </div>

        {/* ── Pending Group Invitations Banner ── */}
        {pendingInvitesCount > 0 && (
          <button
            onClick={() => setLocation("/group-sessions")}
            className="w-full text-left rounded-3xl p-3.5 sm:p-4 bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3 shadow-lg group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Users2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
                  <span>Group Study Invitation ({pendingInvitesCount})</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </p>
                <p className="text-emerald-300/80 text-[11px] truncate">
                  A tutor invited you to a study group. Tap to approve or decline.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-emerald-400 text-xs font-bold group-hover:translate-x-0.5 transition-transform">
              <span>View</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* ── 2. Upcoming Sessions Section (Mockup Structure) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              Upcoming Sessions
            </h2>
            <button
              onClick={() => setLocation("/student/sessions")}
              className="text-xs text-accent font-semibold hover:underline"
            >
              See all
            </button>
          </div>

          {nextSession ? (
            <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-card border border-white/10 shadow-lg space-y-3.5 group hover:border-emerald-500/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {nextSession.subject}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase shrink-0">
                      {nextSession.durationMinutes}m
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {format(new Date(nextSession.scheduledAt), "EEE d MMM · hh:mm a")}
                  </p>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  {getCountdownText(nextSession.scheduledAt)}
                </span>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white text-xs shrink-0">
                    {nextSession.tutorName?.slice(0, 2).toUpperCase() || "TU"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{nextSession.tutorName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">Verified Tutor</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {nextSession.amount && (
                    <span className="text-xs sm:text-sm font-black text-emerald-400">
                      ₦{Number(nextSession.amount).toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={() => setLocation(`/session/${nextSession.id}`)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" /> Join
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-4 sm:p-5 bg-card border border-white/10 text-center py-6 space-y-2">
              <div className="w-9 h-9 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-muted-foreground">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-xs text-white/90 font-medium">No upcoming sessions booked</p>
              <p className="text-[11px] text-muted-foreground">Find an expert university tutor for 1-on-1 exam prep</p>
              <button
                onClick={() => setLocation("/student/find-tutor")}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-colors inline-block"
              >
                Find Tutor
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Weekly Schedule with Horizontal 7-Day Strip ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              My Schedule
            </h2>
            <button
              onClick={() => setLocation("/student/sessions")}
              className="text-xs text-accent font-semibold hover:underline"
            >
              See all
            </button>
          </div>

          {/* Horizontal 7-Day Calendar Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              const hasSessionOnDay = allSessions.some(s => isSameDay(new Date(s.scheduledAt), day));

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 min-w-[46px] sm:min-w-[54px] py-2 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                    isSelected
                      ? "bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20"
                      : isToday
                      ? "bg-white/10 text-white border-emerald-500/50"
                      : "bg-card text-muted-foreground border-white/5 hover:border-white/20"
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-black" : ""}`}>
                    {format(day, "EEE")}
                  </span>
                  <span className={`text-sm sm:text-base font-extrabold ${isSelected ? "text-black" : "text-white"}`}>
                    {format(day, "d")}
                  </span>
                  {hasSessionOnDay && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-black" : "bg-emerald-400"}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day's Sessions */}
          {sessionsOnSelectedDay.length > 0 ? (
            <div className="space-y-2.5">
              {sessionsOnSelectedDay.map((session) => (
                <div
                  key={session.id}
                  className="rounded-3xl p-4 bg-card border border-white/10 shadow-sm flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs truncate">{session.subject}</p>
                      <p className="text-muted-foreground text-[11px] truncate">
                        {session.tutorName} · {format(new Date(session.scheduledAt), "h:mm a")} ({session.durationMinutes}m)
                      </p>
                    </div>
                  </div>
                  {session.status === "confirmed" ? (
                    <button
                      onClick={() => setLocation(`/session/${session.id}`)}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" /> Join
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                      Pending Confirmation
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl p-4 bg-card border border-white/5 text-center py-5">
              <p className="text-xs text-muted-foreground">
                No classes scheduled for {isSameDay(selectedDay, new Date()) ? "today" : format(selectedDay, "EEEE, MMM d")}.
              </p>
            </div>
          )}
        </div>

        {/* ── 4. Primary Quick Actions (4-Column OPay squircle grid) ── */}
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            <button
              onClick={() => setLocation("/student/find-tutor")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Find Tutor</span>
            </button>

            <button
              onClick={() => setLocation("/past-questions")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Past Qs</span>
            </button>

            <button
              onClick={() => setLocation("/arena")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Daily Quiz</span>
            </button>

            <button
              onClick={() => setLocation("/student/wallet")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">My Wallet</span>
            </button>
          </div>
        </div>

        {/* ── 5. Study & Campus Services (4-Column x 2 Rows OPay Grid) ── */}
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Campus & Study Tools
            </h2>
            <button
              onClick={() => setShowInstallApp(true)}
              className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 hover:underline"
            >
              <Smartphone className="w-3 h-3" /> Get App
            </button>
          </div>

          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {/* Row 1 */}
            <button
              onClick={() => setLocation("/flashcards")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">Flashcards</span>
            </button>

            <button
              onClick={() => setLocation("/whiteboard")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/25 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PenTool className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">Whiteboard</span>
            </button>

            <button
              onClick={() => setLocation("/study-lounge")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">Lounge</span>
            </button>

            <button
              onClick={() => setLocation("/cgpa-calculator")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">CGPA Calc</span>
            </button>

            {/* Row 2 */}
            <button
              onClick={() => setLocation("/student/ai-assistant")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">2torAssist</span>
            </button>

            <button
              onClick={() => setLocation("/group-sessions")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform relative">
                <Users2 className="w-5 h-5" />
                {pendingInvitesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center shadow-sm">
                    {pendingInvitesCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">Group Study</span>
            </button>

            <button
              onClick={() => setLocation("/leaderboard")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">Leaderboard</span>
            </button>

            <button
              onClick={() => setLocation("/referral")}
              className="flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-white/90 leading-tight">Refer & Earn</span>
            </button>
          </div>
        </div>

        {/* ── 6. Promo / Task Card (OPay style) ── */}
        <div className="rounded-3xl p-5 bg-gradient-to-r from-emerald-950/40 via-card to-accent/10 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              Exam Practice
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              JAMB, Post-UTME & 100L Past Questions
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Practice timed CBT questions with step-by-step solutions for your courses.
            </p>
          </div>
          <button
            onClick={() => setLocation("/past-questions")}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs whitespace-nowrap shadow-md transition-all shrink-0 active:scale-95"
          >
            Practice Now
          </button>
        </div>

      </div>

      {showInstallApp && (
        <InstallAppModal onClose={() => setShowInstallApp(false)} />
      )}
    </DashboardLayout>
  );
}
