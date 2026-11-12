import { useAuthStore } from "@/lib/auth";
import { useListSessions, useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import {
  Calendar, DollarSign, Users, Clock, Video, ArrowRight, Loader2,
  BadgeCheck, XCircle, Sparkles, Camera, PenTool, Zap, Layers,
  Headphones, GraduationCap, Eye, EyeOff, ChevronRight, BookOpen,
  CreditCard, Check, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TutorFlyerModal from "@/components/TutorFlyerModal";
import { TutorVoiceIntroRecorder } from "@/components/TutorVoiceIntro";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
};

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

export default function TutorDashboardPage() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const BASE = getApiUrl();

  const [rate, setRate] = useState("");
  const [savedRate, setSavedRate] = useState<string | null>(null);
  const [savingRate, setSavingRate] = useState(false);
  const [showFlyer, setShowFlyer] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // 7-day strip for current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const token = useAuthStore.getState().token;
    fetch(`${BASE}/tutors/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.hourlyRate) { setSavedRate(data.hourlyRate); setRate(data.hourlyRate); } })
      .catch(() => {});
  }, [BASE]);

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

  const { data: sessionsData, isLoading: sessionsLoading } = useListSessions({ tutorId: user?.id, limit: 30 });
  const { data: txData } = useListTransactions({ userId: user?.id, limit: 100 });

  const sessions = sessionsData?.sessions ?? [];
  const transactions = txData?.transactions ?? [];
  const totalEarnings = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingSessions = sessions.filter(s => s.status === "pending");
  const confirmedSessions = sessions.filter(s => s.status === "confirmed");
  const nextSession = confirmedSessions[0];

  // Sessions for the selected day in horizontal strip
  const sessionsOnSelectedDay = sessions.filter(s => isSameDay(new Date(s.scheduledAt), selectedDay));
  const pendingOnSelectedDay = pendingSessions.filter(s => isSameDay(new Date(s.scheduledAt), selectedDay));
  const activePendingList = pendingOnSelectedDay.length > 0 ? pendingOnSelectedDay : pendingSessions;

  async function handleUpdateSessionStatus(sessionId: number, newStatus: "confirmed" | "cancelled") {
    setActionLoadingId(sessionId);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${BASE}/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update session status");
      }
      toast({
        title: newStatus === "confirmed" ? "Session Confirmed! 🎉" : "Session Declined",
        description: newStatus === "confirmed"
          ? "The student has been notified and email details were dispatched."
          : "The booking request was rejected.",
      });
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err?.message || "Could not update session status",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <DashboardLayout role="tutor">
      <div className="space-y-4 max-w-4xl mx-auto">

        {/* Pending approval banner */}
        {user?.status === "pending" && (
          <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-yellow-400 font-semibold text-sm">Application Under Review</p>
                <p className="text-muted-foreground text-xs">Our team is reviewing your school ID and CGPA. You'll be notified once approved — usually within 24–48 hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected banner */}
        {(user?.status as string) === "rejected" && (
          <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-red-500/30 bg-red-500/5">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Application Not Approved</p>
                <p className="text-muted-foreground text-xs mt-0.5">Your tutor application was not approved. Contact <span className="text-white">support@2torconnect.com</span> to re-apply.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 1. Top Dual Balance & Sessions Cards (OPay structure) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Earnings */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-950/20 flex flex-col justify-between min-h-[125px] sm:min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
                  <span>Total Earnings</span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-0.5 hover:text-white transition-colors"
                    aria-label="Toggle earnings visibility"
                  >
                    {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => setLocation("/tutor/earnings")}
                  className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold tracking-wide transition-colors"
                >
                  Withdraw
                </button>
              </div>

              <div
                onClick={() => setLocation("/tutor/earnings")}
                className="cursor-pointer group flex items-center gap-1 mt-1"
              >
                <p className="text-xl sm:text-2xl font-black tracking-tight">
                  {showBalance ? `₦${totalEarnings.toLocaleString()}` : "****"}
                </p>
                <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-100/90 font-medium">
              <span>{sessions.length} Total Sessions</span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Tutoring Sessions */}
          <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-purple-700 via-indigo-800 to-primary text-white shadow-lg shadow-purple-950/20 flex flex-col justify-between min-h-[125px] sm:min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs text-purple-100 font-medium">Sessions</span>
                <button
                  onClick={() => setLocation("/tutor/availability")}
                  className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold tracking-wide transition-colors"
                >
                  Schedule
                </button>
              </div>

              <div
                onClick={() => setLocation("/tutor/sessions")}
                className="cursor-pointer group flex items-center gap-1 mt-1"
              >
                <p className="text-xl sm:text-2xl font-black tracking-tight">
                  {confirmedSessions.length} Confirmed
                </p>
                <ChevronRight className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-purple-100/90 font-medium">
              <span>{pendingSessions.length} Pending</span>
              <span className="text-emerald-300 font-bold">Active</span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>
        </div>

        {/* ── 2. Upcoming Sessions Section (Mockup Structure) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              Upcoming Sessions
            </h2>
            <button
              onClick={() => setLocation("/tutor/sessions")}
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
                    {nextSession.studentName?.slice(0, 2).toUpperCase() || "ST"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{nextSession.studentName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">Student</p>
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
                    <Video className="w-3.5 h-3.5" /> Start
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-4 sm:p-5 bg-card border border-white/10 text-center py-6 space-y-2">
              <div className="w-9 h-9 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xs text-white/90 font-medium">No confirmed upcoming sessions</p>
              <p className="text-[11px] text-muted-foreground">Set your weekly calendar availability so students can book you</p>
              <button
                onClick={() => setLocation("/tutor/availability")}
                className="mt-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors inline-block"
              >
                Set Availability
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Booking Request Section with Horizontal 7-Day Strip (Mockup Structure) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Booking Request
            </h2>
            <button
              onClick={() => setLocation("/tutor/sessions")}
              className="text-xs text-accent font-semibold hover:underline"
            >
              See all bookings
            </button>
          </div>

          {/* Horizontal 7-Day Calendar Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              const hasSessionOnDay = sessions.some(s => isSameDay(new Date(s.scheduledAt), day));

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

          {/* Booking Request Cards */}
          {activePendingList.length > 0 ? (
            <div className="space-y-3">
              {activePendingList.map((session) => (
                <div
                  key={session.id}
                  className="rounded-3xl p-4 sm:p-5 bg-card border border-white/10 shadow-sm space-y-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{session.subject}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        {format(new Date(session.scheduledAt), "EEE d MMM · hh:mm a")} ({session.durationMinutes}m)
                      </p>
                    </div>
                    {session.amount && (
                      <span className="text-xs sm:text-sm font-black text-emerald-400 shrink-0">
                        ₦{Number(session.amount).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {session.studentName?.slice(0, 2).toUpperCase() || "ST"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{session.studentName}</p>
                      {session.notes && (
                        <p className="text-[11px] text-muted-foreground italic truncate">
                          "{session.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Direct action buttons matching mockup: Reject (red outline) & Confirm (green solid) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}
                      disabled={actionLoadingId === session.id}
                      className="py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateSessionStatus(session.id, "confirmed")}
                      disabled={actionLoadingId === session.id}
                      className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {actionLoadingId === session.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl p-4 bg-card border border-white/5 text-center py-5">
              <p className="text-xs text-muted-foreground">
                No pending booking requests {isSameDay(selectedDay, new Date()) ? "today" : `for ${format(selectedDay, "EEEE, MMM d")}`}.
              </p>
            </div>
          )}
        </div>

        {/* ── 4. Primary 4-Action Grid for Tutors (OPay squircle style) ── */}
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            <button
              onClick={() => setLocation("/tutor/sessions")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Sessions</span>
            </button>

            <button
              onClick={() => setLocation("/tutor/earnings")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Earnings</span>
            </button>

            <button
              onClick={() => setLocation("/tutor/availability")}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Availability</span>
            </button>

            <button
              onClick={() => setShowFlyer(true)}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90 leading-tight">Get Flyer</span>
            </button>
          </div>
        </div>

        {/* Promote on WhatsApp Status Card */}
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-background to-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {[
            { title: "Group Study", desc: "Create & Invite", href: "/group-sessions", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { title: "2torBoard", desc: "Digital Whiteboard", href: "/whiteboard", icon: PenTool, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { title: "Past Questions", desc: "CBT Exam Bank", href: "/past-questions", icon: GraduationCap, color: "text-accent", bg: "bg-accent/10" },
            { title: "Daily Quiz", desc: "Daily Exam Practice", href: "/arena", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
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
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-accent/20">
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
        <div className="glass-panel rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-white">Recent Sessions</h2>
            <button onClick={() => setLocation("/tutor/sessions")} className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-6">No sessions yet. Students will book once your profile is active.</p>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold text-xs">{s.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[s.status]}`}>{s.status}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{s.studentName} · {format(new Date(s.scheduledAt), "MMM d, h:mm a")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.amount && <span className="text-emerald-400 font-bold text-xs">₦{Number(s.amount).toLocaleString()}</span>}
                    {s.status === "confirmed" && (
                      <button
                        onClick={() => setLocation(`/session/${s.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all"
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
