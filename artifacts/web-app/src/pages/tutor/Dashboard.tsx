import { useAuthStore } from "@/lib/auth";
import { useListSessions, useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Calendar, DollarSign, Users, Star, Clock, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function TutorDashboardPage() {
  const { user } = useAuthStore();

  const { data: sessionsData, isLoading: sessionsLoading } = useListSessions({ tutorId: user?.id, limit: 5 });
  const { data: txData } = useListTransactions({ userId: user?.id, limit: 100 });

  const sessions = sessionsData?.sessions ?? [];
  const transactions = txData?.transactions ?? [];
  const totalEarnings = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingSessions = sessions.filter(s => s.status === "pending").length;
  const confirmedSessions = sessions.filter(s => s.status === "confirmed").length;

  return (
    <DashboardLayout role="tutor" title={`Welcome back, ${user?.name?.split(" ")[0] ?? "Tutor"}`}>
      <div className="space-y-6">
        {user?.status === "pending" && (
          <div className="glass-panel rounded-2xl p-5 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-yellow-400 font-semibold">Application Under Review</p>
                <p className="text-muted-foreground text-sm">Your tutor application is being reviewed by our team. You'll be notified once approved.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Earnings", value: `₦${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
            { label: "Total Sessions", value: sessionsData?.total ?? 0, icon: Calendar, color: "text-accent" },
            { label: "Pending", value: pendingSessions, icon: Clock, color: "text-yellow-400" },
            { label: "Confirmed", value: confirmedSessions, icon: Users, color: "text-blue-400" },
          ].map(stat => (
            <div key={stat.label} className="glass-panel rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-current/10 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
          {sessionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sessions yet. Students will book sessions once your profile is active.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{s.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[s.status]}`}>{s.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Student: {s.studentName} · {format(new Date(s.scheduledAt), "MMM d, h:mm a")}</p>
                  </div>
                  {s.amount && <span className="text-green-400 font-semibold">₦{Number(s.amount).toLocaleString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
