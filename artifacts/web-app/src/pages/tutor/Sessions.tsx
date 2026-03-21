import { useAuthStore } from "@/lib/auth";
import { useListSessions, useUpdateSession } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function TutorSessionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data, isLoading, refetch } = useListSessions({ tutorId: user?.id });

  const updateMutation = useUpdateSession({
    mutation: {
      onSuccess: () => { toast({ title: "Session updated" }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Failed to update session" }),
    },
  });

  const sessions = data?.sessions ?? [];
  const action = (id: number, status: "confirmed" | "completed" | "cancelled") =>
    updateMutation.mutate({ id, data: { status } });

  return (
    <DashboardLayout role="tutor" title="My Sessions">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sessions yet</h3>
            <p className="text-muted-foreground">Sessions booked by students will appear here.</p>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[session.status] ?? ""}`}>
                    {session.status}
                  </span>
                  <span className="text-white font-semibold">{session.subject}</span>
                </div>
                <p className="text-muted-foreground text-sm">Student: <span className="text-white">{session.studentName}</span></p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(session.scheduledAt), "h:mm a")} · {session.durationMinutes}min
                  </span>
                  {session.amount && (
                    <span className="text-green-400 font-semibold">₦{Number(session.amount).toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {session.status === "pending" && (
                  <>
                    <button onClick={() => action(session.id, "confirmed")} disabled={updateMutation.isPending}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Confirm
                    </button>
                    <button onClick={() => action(session.id, "cancelled")} disabled={updateMutation.isPending}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Decline
                    </button>
                  </>
                )}

                {session.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => setLocation(`/session/${session.id}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 animate-pulse-slow"
                    >
                      <Video className="w-4 h-4" />
                      Start Session
                    </button>
                    <button onClick={() => action(session.id, "completed")} disabled={updateMutation.isPending}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Mark Complete
                    </button>
                  </>
                )}

                {session.status === "completed" && (
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium px-3 py-2">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
