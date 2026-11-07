import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Wallet, TrendingUp, ArrowDownCircle, Plus, X, Loader2, CreditCard, CheckCircle, AlertCircle, Building2, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

function FundModal({ onClose, onFundSuccess }: { onClose: () => void; onFundSuccess?: () => void }) {
  const [tab, setTab] = useState<"transfer" | "card">("transfer");
  const [amount, setAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("2000");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user, token } = useAuthStore();

  const PRESETS = [1000, 2000, 5000, 10000, 20000, 50000];

  // Deterministic dedicated virtual account number for user
  const studentId = user?.id || 1;
  const virtualAccountNo = `990${String(studentId).padStart(7, "0")}`;
  const virtualAccountName = `2torConnect / ${user?.name || "Student"}`;

  const copyAccount = () => {
    navigator.clipboard.writeText(virtualAccountNo);
    setCopied(true);
    toast({ title: "Account Number Copied!", description: `${virtualAccountNo} copied to clipboard.` });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmTransfer = async () => {
    const parsed = Number(transferAmount);
    if (!parsed || parsed < 100) {
      toast({ variant: "destructive", title: "Minimum transfer is ₦100" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/wallet/direct-transfer-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parsed, senderName: senderName || user?.name || "Student", bankName: "Bank App / OPay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm transfer");
      toast({ title: "Payment Confirmed! 🚀", description: data.message });
      if (onFundSuccess) onFundSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Confirmation error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

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
        throw new Error(err.error ?? "Failed to initiate payment");
      }
      const data = await res.json();
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      toast({ variant: "destructive", title: "Payment initiation failed", description: e.message });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-5 border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Fund Your Wallet</h3>
            <p className="text-xs text-muted-foreground">Select your preferred payment method</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setTab("transfer")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === "transfer" ? "bg-accent/20 text-accent border border-accent/40 shadow-sm" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Bank Transfer (Instant)
          </button>
          <button
            onClick={() => setTab("card")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === "card" ? "bg-accent/20 text-accent border border-accent/40 shadow-sm" : "text-muted-foreground hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Debit Card
          </button>
        </div>

        {tab === "transfer" ? (
          <div className="space-y-4">
            {/* Virtual Account Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-background to-black border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Dedicated Transfer Account
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero Transfer Fees
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="text-sm font-bold text-white">Wema Bank (Monnify Direct)</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Account Number</p>
                  <p className="text-xl font-extrabold text-accent font-mono tracking-widest">{virtualAccountNo}</p>
                </div>
                <button
                  onClick={copyAccount}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold transition-all border border-accent/30"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="text-xs font-semibold text-white/90">{virtualAccountName}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground space-y-1">
              <p className="text-white font-semibold">How to transfer:</p>
              <p>1. Open your bank app (OPay, PalmPay, Kuda, GTBank, Zenith, etc.).</p>
              <p>2. Transfer any amount to the account details above.</p>
              <p>3. Enter the amount transferred below and click <strong>Confirm Transfer</strong>.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block">Amount Transferred (₦)</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base focus:outline-none focus:border-accent"
              />
            </div>

            <button
              onClick={handleConfirmTransfer}
              disabled={loading || !transferAmount}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? "Verifying Transfer..." : "I Have Paid / Confirm Transfer"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
              <p className="font-semibold text-accent mb-1">Secure Payment via Monnify</p>
              <p>You'll be redirected to Monnify's secure checkout to complete payment with card.</p>
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
                {loading ? "Redirecting…" : "Pay Now"}
              </button>
            </div>
          </div>
        )}
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
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [showFund, setShowFund] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"success" | "failed" | null>(null);

  const { data, isLoading, refetch } = useListTransactions({ userId: user?.id });

  const transactions = data?.transactions ?? [];
  const completed = transactions.filter((t) => t.status === "completed");
  const totalFunded = completed.filter((t) => t.type === "bonus").reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = completed.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalFunded - totalSpent;

  // Verify payment when Monnify redirects back with transactionReference in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionReference = params.get("transactionReference");
    if (!transactionReference || !token) return;

    // Clean query params from URL without triggering a reload
    const url = new URL(window.location.href);
    url.searchParams.delete("transactionReference");
    url.searchParams.delete("paymentReference");
    url.searchParams.delete("paymentStatus");
    window.history.replaceState({}, "", url.toString());

    setVerifying(true);
    fetch(`${getApiUrl()}/wallet/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ transactionReference }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Verification failed");
        }
        return res.json();
      })
      .then(() => {
        setVerifyStatus("success");
        toast({ title: "Payment confirmed!", description: "Your wallet has been funded successfully." });
        refetch();
      })
      .catch((e: any) => {
        setVerifyStatus("failed");
        toast({ variant: "destructive", title: "Payment verification failed", description: e.message });
      })
      .finally(() => setVerifying(false));
  }, [token]);

  return (
    <DashboardLayout role="student" title="My Wallet">
      {showFund && <FundModal onClose={() => setShowFund(false)} />}

      {/* Payment verification banners */}
      {verifying && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <p className="text-sm font-medium">Verifying your payment with Monnify…</p>
        </div>
      )}
      {verifyStatus === "success" && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Payment confirmed! Your wallet has been funded.</p>
        </div>
      )}
      {verifyStatus === "failed" && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Payment verification failed. If you were charged, please contact support.</p>
        </div>
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
                    <p className={`text-xs capitalize ${
                      t.status === "pending" ? "text-yellow-400" :
                      t.status === "failed" ? "text-red-400" :
                      "text-muted-foreground"
                    }`}>
                      {t.status}
                    </p>
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
