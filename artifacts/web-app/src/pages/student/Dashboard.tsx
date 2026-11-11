import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useListSessions, useListTransactions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import {
  BookOpen, Clock, CheckCircle2, Video, ArrowRight, Loader2,
  Zap, Layers, PenTool, Headphones, GraduationCap, Calculator,
  Sparkles, Flame, Smartphone, Eye, EyeOff, Plus, Search, Wallet,
  ChevronRight, Users2, Trophy, Gift
} from "lucide-react";
import { format } from "date-fns";
import InstallAppModal from "@/components/InstallAppModal";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const [showInstallApp, setShowInstallApp] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAcademics, setShowAcademics] = useState(true);

  const { data: sessionsData, isLoading: sessionsLoading } = useListSessions({ studentId: user?.id, limit: 10 });
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

        {/* ── 2. Notice / Status Ticker Strip (OPay SafeBox style) ── */}
        {nextSession ? (
          <div
            onClick={() => setLocation(`/session/${nextSession.id}`)}
            className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-card to-accent/10 border border-emerald-500/30 cursor-pointer hover:border-emerald-500/50 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Video className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <p className="text-xs text-white truncate font-medium">
                Next: <strong className="text-emerald-400">{nextSession.subject}</strong> with {nextSession.tutorName} · {format(new Date(nextSession.scheduledAt), "h:mm a")}
              </p>
            </div>
            <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-bold shrink-0">
              Join <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        ) : (
          <div
            onClick={() => setLocation("/arena")}
            className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-card border border-white/10 cursor-pointer hover:border-accent/30 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-white/90 truncate font-medium">
                Daily Practice Quiz: Test your knowledge in 5 quick questions
              </p>
            </div>
            <span className="flex items-center gap-0.5 text-xs text-accent font-bold shrink-0">
              Play <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* ── 3. Primary Quick Actions (4-Column OPay squircle grid) ── */}
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

        {/* ── 4. Study & Campus Services (4-Column x 2 Rows OPay Grid) ── */}
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
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users2 className="w-5 h-5" />
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

        {/* ── 5. Promo / Task Card (OPay style) ── */}
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

        {/* ── 6. Upcoming Sessions Card ── */}
        <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Upcoming Sessions
            </h2>
            <button
              onClick={() => setLocation("/student/sessions")}
              className="text-xs text-accent font-semibold flex items-center gap-0.5 hover:underline"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : confirmedSessions.length > 0 ? (
            <div className="space-y-2.5">
              {confirmedSessions.slice(0, 3).map(session => (
                <div key={session.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs truncate">{session.subject}</p>
                      <p className="text-muted-foreground text-[11px] truncate">
                        {session.tutorName} · {format(new Date(session.scheduledAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocation(`/session/${session.id}`)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1"
                  >
                    <Video className="w-3 h-3" /> Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-muted-foreground">No upcoming sessions booked.</p>
              <button
                onClick={() => setLocation("/student/find-tutor")}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors"
              >
                Find & Book a Tutor
              </button>
            </div>
          )}
        </div>

      </div>

      {showInstallApp && (
        <InstallAppModal onClose={() => setShowInstallApp(false)} />
      )}
    </DashboardLayout>
  );
}
