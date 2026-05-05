import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useListSessions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Video, Clock, CalendarDays, User, BookOpen,
  Wifi, WifiOff, ArrowRight, Loader2, BadgeCheck, DollarSign, CreditCard
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  role: "student" | "tutor";
}

export default function LiveSessionsPage({ role }: Props) {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();

  const query = role === "tutor"
    ? { tutorId: user?.id, limit: 50 }
    : { studentId: user?.id, limit: 50 };

  const { data, isLoading } = useListSessions(query);

  const allSessions = data?.sessions ?? [];
  const confirmed = allSessions.filter(s => s.status === "confirmed");
  const pending = allSessions.filter(s => s.status === "pending");

  return (
    <DashboardLayout role={role} title="Live Sessions">
      <div className="space-y-6 max-w-3xl">

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/10 border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-1">2torConnect Live Sessions</h2>
              <p className="text-muted-foreground text-sm">
                {role === "tutor"
                  ? "Stream your live sessions directly inside 2torConnect — paste your stream link when confirming a booking."
                  : "Watch your tutor's live session in full HD, right here inside 2torConnect — no external apps needed."}
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {role === "student" ? [
            { icon: CalendarDays, title: "Book a Session", desc: "Find a tutor and book a time slot", color: "text-accent" },
            { icon: CreditCard, title: "Pay to Confirm", desc: "Pay the session fee — tutor is auto-notified", color: "text-green-400" },
            { icon: Video, title: "Watch Live", desc: "Join the session live inside 2torConnect", color: "text-primary" },
          ] : [
            { icon: CalendarDays, title: "Set Your Rate", desc: "Students see your price when booking", color: "text-accent" },
            { icon: Wifi, title: "Confirm & Link", desc: "Confirm booking and add your stream URL", color: "text-green-400" },
            { icon: Video, title: "Go Live", desc: "Stream and students watch inside the platform", color: "text-primary" },
          ]}
          {role === "student" ? [
            { icon: CalendarDays, title: "Book a Session", desc: "Find a tutor and book a time slot", color: "text-accent" },
            { icon: CreditCard, title: "Pay to Confirm", desc: "Pay the session fee — tutor is auto-notified", color: "text-green-400" },
            { icon: Video, title: "Watch Live", desc: "Join the session live inside 2torConnect", color: "text-primary" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
          )) : [
            { icon: CalendarDays, title: "Set Your Rate", desc: "Students see your price when booking", color: "text-accent" },
            { icon: Wifi, title: "Confirm & Link", desc: "Confirm booking and add your stream URL", color: "text-green-400" },
            { icon: Video, title: "Go Live", desc: "Stream and students watch inside the platform", color: "text-primary" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
          ))}
        </div>

        {/* Confirmed sessions */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              Ready to Join
            </h3>
            {confirmed.length > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">
                {confirmed.length} session{confirmed.length !== 1 ? "s" : ""} confirmed
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-accent" />
            </div>
          ) : confirmed.length > 0 ? (
            <div className="space-y-3">
              {confirmed.map((session, i) => {
                const isPaid = (session as any).isPaid === 1;
                const hasAmount = !!session.amount;
                const canJoin = isPaid || !hasAmount;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm">{session.subject}</p>
                        {isPaid && (
                          <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                            <BadgeCheck className="w-3 h-3" /> Paid
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {role === "tutor" ? `Student: ${session.studentName}` : `Tutor: ${session.tutorName}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-white/60 flex-wrap">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(new Date(session.scheduledAt), "MMM d, h:mm a")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.durationMinutes} min</span>
                        {session.amount && (
                          <span className="flex items-center gap-1 text-accent font-semibold"><DollarSign className="w-3 h-3" />{Number(session.amount).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {role === "student" && !canJoin ? (
                      <button
                        onClick={() => setLocation("/student/sessions")}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-green-500/25"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay to Join
                      </button>
                    ) : (
                      <button
                        onClick={() => setLocation(`/session/${session.id}`)}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                      >
                        <Video className="w-4 h-4" />
                        {role === "tutor" ? "Start" : "Join"}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <WifiOff className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-white font-bold text-lg mb-1">No confirmed sessions yet</p>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {role === "student"
                    ? "Book a session with a tutor — once confirmed and paid, your live session will appear here."
                    : "Once a student books and pays, you can start the live session from here."}
                </p>
              </div>
              {role === "student" && (
                <button
                  onClick={() => setLocation("/student/find-tutor")}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all"
                >
                  <BookOpen className="w-4 h-4" /> Find a Tutor <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {role === "tutor" && (
                <button
                  onClick={() => setLocation("/tutor/sessions")}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all"
                >
                  <User className="w-4 h-4" /> View Pending Requests <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pending sessions */}
        {pending.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" /> Awaiting Confirmation
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold ml-1">{pending.length}</span>
            </h3>
            <div className="space-y-2">
              {pending.slice(0, 3).map(session => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                  <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{session.subject}</p>
                    <p className="text-muted-foreground text-xs">{format(new Date(session.scheduledAt), "MMM d, h:mm a")}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold shrink-0">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment API info card */}
        <div className="glass-panel rounded-2xl p-5 border border-accent/20">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" /> Global Payment Integration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white font-semibold mb-1">🌍 Flutterwave</p>
              <p className="text-muted-foreground text-xs">Best for Africa + 150 countries. Supports NGN, USD, GBP, EUR and 30+ currencies. Cards, bank transfer, mobile money.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white font-semibold mb-1">🌐 Stripe</p>
              <p className="text-muted-foreground text-xs">Best for US, UK, Europe + global. 135+ currencies. Apple Pay, Google Pay, cards — industry standard worldwide.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong className="text-accent">Recommendation:</strong> Use <strong className="text-white">Flutterwave</strong> as your primary gateway for Africa + global reach, and add <strong className="text-white">Stripe</strong> for Western markets.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
