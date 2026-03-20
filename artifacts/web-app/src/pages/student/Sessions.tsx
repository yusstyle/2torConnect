import { useAuthStore } from "@/lib/auth";
import { useListSessions, useUpdateSession } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Calendar, Clock, BookOpen, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function StudentSessionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListSessions({ studentId: user?.id });

  const cancelMutation = useUpdateSession({
    mutation: {
      onSuccess: () => { toast({ title: "Session cancelled" }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Failed to cancel" }),
    },
  });

  const sessions = data?.sessions ?? [];

  return (
    <DashboardLayout role="student" title="My Sessions">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-6">Book your first session with a tutor to get started.</p>
            <a href="/student/find-tutor" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-all">
              Find a Tutor
            </a>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[session.status] ?? ""}`}>
                    {session.status}
                  </span>
                  <span className="text-white font-semibold">{session.subject}</span>
                </div>
                <p className="text-muted-foreground text-sm">Tutor: <span className="text-white">{session.tutorName}</span></p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(session.scheduledAt), "h:mm a")} · {session.durationMinutes}min
                  </span>
                </div>
                {session.notes && <p className="text-sm text-muted-foreground italic">{session.notes}</p>}
              </div>
              {session.status === "pending" && (
                <button
                  onClick={() => cancelMutation.mutate({ id: session.id, data: { status: "cancelled" } })}
                  disabled={cancelMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              )}
              {session.status === "confirmed" && (
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Confirmed
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
