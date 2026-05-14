import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Wallet, TrendingUp, ArrowDownCircle, Plus, X, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

function FundModal({ onClose, onFunded }: { onClose: () => void; onFunded: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuthStore();

  const PRESETS = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleFund = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/wallet/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parsed }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to fund wallet");
      }
      toast({ title: "Wallet funded!", description: `₦${parsed.toLocaleString()} added to your wallet.` });
      onFunded();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Funding failed", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Fund Your Wallet</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              className={`py-2 rounded-xl text-sm font-semibold transition-all border ${
                amount === String(p)
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
              }`}
            >
              ₦{p.toLocaleString()}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Or enter custom amount (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 15000"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 text-lg font-bold"
          />
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-accent mb-1">Simulated Payment</p>
          <p>Funds are added instantly to your wallet balance for use in booking sessions.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleFund}
            disabled={loading || !amount}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Funds
          </button>
        </div>
      </div>
    </div>
  );
}

const typeColors: Record<string, string> = {
  payment: "text-red-400",
  bonus: "text-green-400",
  refund: "text-yellow-400",
  withdrawal: "text-red-400",
};

const typeLabels: Record<string, string> = {
  payment: "Session Payment",
  bonus: "Wallet Top-up",
  refund: "Refund",
  withdrawal: "Withdrawal",
};

export default function StudentWalletPage() {
  const { user } = useAuthStore();
  const [showFund, setShowFund] = useState(false);

  const { data, isLoading, refetch } = useListTransactions({ userId: user?.id });

  const transactions = data?.transactions ?? [];
  const completed = transactions.filter((t) => t.status === "completed");
  const totalFunded = completed.filter((t) => t.type === "bonus").reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = completed.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalFunded - totalSpent;

  return (
    <DashboardLayout role="student" title="My Wallet">
      {showFund && (
        <FundModal
          onClose={() => setShowFund(false)}
          onFunded={() => { setShowFund(false); refetch(); }}
        />
      )}

      <div className="space-y-6">
        {/* Balance card */}
        <div className="relative overflow-hidden glass-panel rounded-3xl p-8 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-accent" />
              <span className="text-sm text-muted-foreground font-medium">Available Balance</span>
            </div>
            <div className="text-5xl font-extrabold text-white mb-6 tracking-tight">
              ₦{balance.toLocaleString()}
            </div>
            <button
              onClick={() => setShowFund(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/30"
            >
              <Plus className="w-4 h-4" />
              Add Money
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Total Funded", value: `₦${totalFunded.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
            { label: "Total Spent on Sessions", value: `₦${totalSpent.toLocaleString()}`, icon: CreditCard, color: "text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`} style={{ background: "rgba(255,255,255,0.05)" }}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <ArrowDownCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet. Fund your wallet to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...transactions].reverse().map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20">
                  <div>
                    <p className="text-white font-medium">{typeLabels[t.type] ?? t.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.description ?? "—"} · {format(new Date(t.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${typeColors[t.type] ?? "text-white"}`}>
                      {t.type === "payment" || t.type === "withdrawal" ? "-" : "+"}₦{Number(t.amount).toLocaleString()}
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
