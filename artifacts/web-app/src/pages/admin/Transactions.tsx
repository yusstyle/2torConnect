import { useState } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Search, Loader2, TrendingUp } from "lucide-react";

const typeColors: Record<string, string> = {
  payment: "text-green-400",
  withdrawal: "text-red-400",
  refund: "text-yellow-400",
  bonus: "text-blue-400",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function AdminTransactionsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListTransactions(
    { type: (typeFilter as any) || undefined, page, limit: 20 }
  );

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const totalRevenue = transactions.filter(t => t.type === "payment" && t.status === "completed")
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <DashboardLayout role="admin" title="Transactions">
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue (filtered)</p>
            <p className="text-2xl font-bold text-white">₦{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent">
            <option value="">All Types</option>
            <option value="payment">Payments</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="refund">Refunds</option>
            <option value="bonus">Bonuses</option>
          </select>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <span className="text-sm text-muted-foreground">{total} transactions</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No transactions found.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map(t => (
                <div key={t.id} className="p-4 flex items-center gap-4 hover:bg-white/2 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium capitalize ${typeColors[t.type] ?? "text-white"}`}>{t.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status] ?? ""}`}>{t.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t.userName ?? "Unknown"} · {t.description ?? "—"} · {format(new Date(t.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <span className={`font-bold text-lg ${typeColors[t.type] ?? "text-white"}`}>
                    {t.type === "withdrawal" ? "-" : "+"}₦{Number(t.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors">
              Previous
            </button>
            <span className="px-4 py-2 text-muted-foreground text-sm">Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
