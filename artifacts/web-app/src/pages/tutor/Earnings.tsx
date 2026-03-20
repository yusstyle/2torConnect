import { useAuthStore } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2 } from "lucide-react";

const typeColors: Record<string, string> = {
  payment: "text-green-400",
  withdrawal: "text-red-400",
  refund: "text-yellow-400",
  bonus: "text-blue-400",
};

export default function TutorEarningsPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useListTransactions({ userId: user?.id });

  const transactions = data?.transactions ?? [];
  const completed = transactions.filter(t => t.status === "completed");
  const totalEarned = completed.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = completed.filter(t => t.type === "withdrawal").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalEarned - totalWithdrawn;

  return (
    <DashboardLayout role="tutor" title="Earnings & Payouts">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Earned", value: `₦${totalEarned.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
            { label: "Withdrawn", value: `₦${totalWithdrawn.toLocaleString()}`, icon: DollarSign, color: "text-red-400" },
            { label: "Available Balance", value: `₦${balance.toLocaleString()}`, icon: CheckCircle, color: "text-accent" },
          ].map(stat => (
            <div key={stat.label} className="glass-panel rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`} style={{ background: "rgba(255,255,255,0.05)" }}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet. Earnings will appear here after completing sessions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20">
                  <div>
                    <p className="text-white font-medium capitalize">{t.type}</p>
                    <p className="text-sm text-muted-foreground">{t.description ?? "—"} · {format(new Date(t.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${typeColors[t.type] ?? "text-white"}`}>
                      {t.type === "withdrawal" ? "-" : "+"}₦{Number(t.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
