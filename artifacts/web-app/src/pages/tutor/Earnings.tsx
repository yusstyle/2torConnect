import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2, ArrowUpRight, X, Building2, CreditCard, Hash, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

const typeColors: Record<string, string> = {
  payment: "text-green-400",
  withdrawal: "text-red-400",
  refund: "text-yellow-400",
  bonus: "text-blue-400",
};

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "First City Monument Bank", "Globus Bank", "GT Bank", "Heritage Bank",
  "Keystone Bank", "Parallex Bank", "Polaris Bank", "Providus Bank",
  "Stanbic IBTC Bank", "Standard Chartered", "Sterling Bank", "SunTrust Bank",
  "Union Bank", "United Bank for Africa", "Unity Bank", "Wema Bank", "Zenith Bank",
  "Kuda Bank", "Opay", "PalmPay", "Moniepoint",
];

function WithdrawModal({
  availableBalance,
  onClose,
  onWithdrawn,
}: {
  availableBalance: number;
  onClose: () => void;
  onWithdrawn: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuthStore();

  const handleWithdraw = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    if (parsed > availableBalance) {
      toast({ variant: "destructive", title: "Insufficient balance", description: `You only have ₦${availableBalance.toLocaleString()} available.` });
      return;
    }
    if (!bankName || !accountNumber.trim() || !accountName.trim()) {
      toast({ variant: "destructive", title: "Fill in all bank details" });
      return;
    }
    if (accountNumber.length < 10) {
      toast({ variant: "destructive", title: "Enter a valid 10-digit account number" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/wallet/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parsed, bankName, accountNumber, accountName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Withdrawal failed");
      }
      toast({ title: "Withdrawal requested!", description: `₦${parsed.toLocaleString()} will be sent to ${accountName} at ${bankName}.` });
      onWithdrawn();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Withdrawal failed", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 space-y-4 border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Withdraw Earnings</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Available Balance</span>
          <span className="text-white font-bold text-lg">₦{availableBalance.toLocaleString()}</span>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Amount to Withdraw (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 5000"
            max={availableBalance}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 text-lg font-bold"
          />
          {availableBalance > 0 && (
            <button
              onClick={() => setAmount(String(availableBalance))}
              className="mt-1.5 text-xs text-accent hover:underline"
            >
              Withdraw all (₦{availableBalance.toLocaleString()})
            </button>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Bank Name
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent/50 appearance-none"
          >
            <option value="" className="bg-gray-900">Select bank...</option>
            {NIGERIAN_BANKS.map((b) => (
              <option key={b} value={b} className="bg-gray-900">{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" /> Account Number
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit account number"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Account Name
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Account holder name"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading || !amount || !bankName || !accountNumber || !accountName}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TutorEarningsPage() {
  const { user } = useAuthStore();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data, isLoading, refetch } = useListTransactions({ userId: user?.id });

  const transactions = data?.transactions ?? [];
  const completed = transactions.filter((t) => t.status === "completed");
  const totalEarned = completed.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = completed.filter((t) => t.type === "withdrawal").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalEarned - totalWithdrawn;

  return (
    <DashboardLayout role="tutor" title="Earnings & Payouts">
      {showWithdraw && (
        <WithdrawModal
          availableBalance={balance}
          onClose={() => setShowWithdraw(false)}
          onWithdrawn={() => { setShowWithdraw(false); refetch(); }}
        />
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Earned", value: `₦${totalEarned.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
            { label: "Withdrawn", value: `₦${totalWithdrawn.toLocaleString()}`, icon: DollarSign, color: "text-red-400" },
            { label: "Available Balance", value: `₦${balance.toLocaleString()}`, icon: CheckCircle, color: "text-accent" },
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

        {balance > 0 && (
          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-accent/20 bg-accent/5">
            <div>
              <p className="text-white font-semibold">Ready to cash out?</p>
              <p className="text-sm text-muted-foreground mt-0.5">You have ₦{balance.toLocaleString()} available to withdraw.</p>
            </div>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/30 shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        )}

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
            {balance === 0 && (
              <button
                onClick={() => setShowWithdraw(true)}
                disabled={balance <= 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-muted-foreground text-sm font-medium opacity-50 cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" /> Withdraw
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet. Earnings will appear here after completing sessions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...transactions].reverse().map((t) => (
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
