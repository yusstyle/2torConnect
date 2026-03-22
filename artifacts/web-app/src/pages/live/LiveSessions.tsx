import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useListSessions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Video, Clock, CalendarDays, User, BookOpen,
  Wifi, WifiOff, ArrowRight, Loader2
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
              <h2 className="text-white font-bold text-xl mb-1">Video Sessions via Jitsi Meet</h2>
              <p className="text-muted-foreground text-sm">
                {role === "tutor"
                  ? "Join your confirmed sessions with a single click — no downloads needed."
                  : "Join your booked sessions. Video, audio and screen sharing are all included — free."}
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: CalendarDays, title: "Book a Session", desc: role === "student" ? "Find a tutor and book a time" : "Student books, you confirm", color: "text-accent" },
            { icon: Wifi, title: "Session Confirmed", desc: "Both parties confirm the session", color: "text-green-400" },
            { icon: Video, title: "Click Join", desc: "Enter the video room instantly", color: "text-primary" },
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
              {confirmed.map((session, i) => (
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
                    <p className="text-white font-bold text-sm">{session.subject}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {role === "tutor" ? `Student: ${session.studentName}` : `Tutor: ${session.tutorName}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-white/60">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(new Date(session.scheduledAt), "MMM d, h:mm a")}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.durationMinutes} min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocation(`/session/${session.id}`)}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                  >
                    <Video className="w-4 h-4" />
                    {role === "tutor" ? "Start" : "Join"}
                  </button>
                </motion.div>
              ))}
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
                    ? "Book a session with a tutor and once they confirm it, the join button will appear here."
                    : "Once a student books a session and you confirm it, you can start the video call from here."}
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

        {/* Pending sessions (info only) */}
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
      </div>
    </DashboardLayout>
  );
}
