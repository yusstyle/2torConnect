import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useListSessions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { BookOpen, Clock, CheckCircle2, Video, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const { data: sessionsData, isLoading } = useListSessions({ studentId: user?.id, limit: 10 });

  const allSessions = sessionsData?.sessions || [];
  const confirmedSessions = allSessions.filter(s => s.status === "confirmed");
  const completedSessions = allSessions.filter(s => s.status === "completed");
  const nextSession = confirmedSessions[0];

  return (
    <DashboardLayout role="student" title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}!`}>
      <div className="space-y-6">

        {/* Live Session Banner — shown when there's a confirmed session */}
        {nextSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-primary via-primary/80 to-accent shadow-2xl shadow-primary/30 border border-white/10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Session Ready</span>
                </div>
                <h3 className="text-white font-bold text-xl leading-tight">{nextSession.subject}</h3>
                <p className="text-white/70 text-sm mt-0.5">
                  with <strong className="text-white">{nextSession.tutorName}</strong> ·{" "}
                  {format(new Date(nextSession.scheduledAt), "MMM d 'at' h:mm a")} · {nextSession.durationMinutes} min
                </p>
              </div>
              <button
                onClick={() => setLocation(`/session/${nextSession.id}`)}
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-primary font-bold hover:bg-white/90 transition-all shadow-lg text-sm"
              >
                <Video className="w-4 h-4" />
                Join Session
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-accent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/20 text-accent"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-white">{confirmedSessions.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-primary">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-white">{completedSessions.length}</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setLocation("/student/find-tutor")}
            className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border-white/10 cursor-pointer hover:border-accent/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold mb-0.5">Need help?</p>
                <p className="text-xs text-muted-foreground">Find a tutor now</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 text-white group-hover:bg-accent/20 transition-all">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Upcoming Sessions</h2>
            <button onClick={() => setLocation("/student/sessions")} className="text-sm text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : confirmedSessions.length > 0 ? (
            <div className="space-y-3">
              {confirmedSessions.slice(0, 4).map(session => (
                <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{session.subject}</p>
                    <p className="text-muted-foreground text-xs">with {session.tutorName} · {format(new Date(session.scheduledAt), "MMM d, h:mm a")}</p>
                  </div>
                  <button
                    onClick={() => setLocation(`/session/${session.id}`)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold hover:opacity-90 transition-all"
                  >
                    <Video className="w-3 h-3" /> Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-white font-medium mb-1">No upcoming sessions</p>
              <p className="text-sm text-muted-foreground mb-4">Book a session with a tutor to get started.</p>
              <button
                onClick={() => setLocation("/student/find-tutor")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                Find a Tutor
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
