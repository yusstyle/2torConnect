import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import {
  Wallet,
  TrendingUp,
  Plus,
  X,
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

function FundModal({ onClose, onFundSuccess }: { onClose: () => void; onFundSuccess?: () => void }) {
  const [tab, setTab] = useState<"card" | "transfer">("card");
  const [amount, setAmount] = useState("5000");
  const [transferAmount, setTransferAmount] = useState("2000");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user, token } = useAuthStore();

  const PRESETS = [1000, 2000, 5000, 10000, 20000, 50000];

  const studentId = user?.id || 1;
  const virtualAccountNo = `990${String(studentId).padStart(7, "0")}`;
  const virtualAccountName = `2torConnect / ${user?.name || "Student"}`;

  const copyAccount = () => {
    navigator.clipboard.writeText(virtualAccountNo);
    setCopied(true);
    toast({ title: "Account Number Copied!", description: `${virtualAccountNo} copied to clipboard.` });
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePaystackFund = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed < 100) {
      toast({ variant: "destructive", title: "Enter a valid amount", description: "Minimum top-up is ₦100" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/wallet/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parsed,
          redirectUrl: `${window.location.origin}/student/wallet`,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to initiate payment");
      }
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned from payment processor");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Payment failed to start", description: e.message });
      setLoading(false);
    }
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
        body: JSON.stringify({ amount: parsed, senderName: senderName || user?.name || "Student", bankName: "Bank Transfer / OPay" }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-5 border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
              <span>Fund Your Wallet</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Real Payments
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pay securely with Visa, Mastercard, or Bank Transfer</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setTab("card")}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === "card"
                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Card / Paystack
          </button>
          <button
            onClick={() => setTab("transfer")}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === "transfer"
                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Bank Transfer
          </button>
        </div>

        {tab === "card" ? (
          <div className="space-y-4">
            {/* Accepted payment methods badge bar */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-white/70 block">Accepted Payment Methods:</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/40">
                  VISA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-600/30 text-red-300 border border-red-500/40">
                  Mastercard
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
                  Verve
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-600/30 text-cyan-300 border border-cyan-500/40">
                  Bank Transfer
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-600/30 text-amber-300 border border-amber-500/40">
                  USSD
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  OPay & Kuda
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Select Amount</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      amount === String(p)
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    ₦{p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Or Enter Custom Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 text-lg font-bold"
                />
              </div>
            </div>

            {/* Security note */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300/90 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-300">Secured by Paystack</p>
                <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                  256-bit bank grade encryption. Supports all Nigerian & international Visa and Mastercard debit/credit cards.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePaystackFund}
                disabled={loading || !amount || Number(amount) < 100}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-black" />}
                {loading ? "Connecting Paystack…" : `Pay ₦${Number(amount || 0).toLocaleString()} with Paystack`}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Virtual Account Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-background to-black border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Dedicated Direct Transfer
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Credit
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="text-sm font-bold text-white">Paystack Direct / Bank Transfer</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Student Account Number</p>
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? "Verifying Transfer..." : "I Have Paid / Confirm Transfer"}
            </button>
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
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [showFund, setShowFund] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"success" | "failed" | null>(null);

  const { data, isLoading, refetch } = useListTransactions({ userId: user?.id });

  const transactions = data?.transactions ?? [];
  const completed = transactions.filter((t) => t.status === "completed");
  const totalFunded = completed.filter((t) => t.type === "bonus").reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = completed.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const balance = Math.max(0, totalFunded - totalSpent);

  // Verify payment when Paystack redirects back with reference or trxref in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref") || params.get("transactionReference");
    if (!ref || !token) return;

    // Clean query params from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete("reference");
    url.searchParams.delete("trxref");
    url.searchParams.delete("transactionReference");
    url.searchParams.delete("paymentReference");
    url.searchParams.delete("paymentStatus");
    window.history.replaceState({}, "", url.toString());

    setVerifying(true);
    fetch(`${getApiUrl()}/wallet/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reference: ref }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Verification failed");
        }
        return res.json();
      })
      .then((d) => {
        setVerifyStatus("success");
        toast({
          title: "Payment Confirmed! 🚀",
          description: d.message || "Your wallet has been funded successfully via Paystack.",
        });
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
      {showFund && <FundModal onClose={() => setShowFund(false)} onFundSuccess={() => refetch()} />}

      {/* Payment verification banners */}
      {verifying && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <p className="text-sm font-medium">Verifying your payment with Paystack…</p>
        </div>
      )}
      {verifyStatus === "success" && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Payment confirmed! Your wallet has been funded via Paystack.</p>
        </div>
      )}
      {verifyStatus === "failed" && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Payment verification failed. If you were charged, please contact support.</p>
        </div>
      )}

      <div className="space-y-5 sm:space-y-6">
        {/* Balance card */}
        <div className="relative overflow-hidden glass-panel rounded-3xl p-5 sm:p-8 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">Available Balance</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Paystack Active</span>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5 sm:mb-6 tracking-tight">
              ₦{balance.toLocaleString()}
            </div>
            <button
              onClick={() => setShowFund(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add Money (Card / Bank)
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Total Funded", value: `₦${totalFunded.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
            { label: "Total Spent", value: `₦${totalSpent.toLocaleString()}`, icon: CreditCard, color: "text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 ${stat.color}`} style={{ background: "rgba(255,255,255,0.05)" }}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{t.description || typeLabels[t.type] || t.type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "MMM d, yyyy • h:mm a")}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${typeColors[t.type] ?? "text-white"}`}>
                      {t.type === "payment" || t.type === "withdrawal" ? "-" : "+"}₦{Number(t.amount).toLocaleString()}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "completed" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {t.status}
                    </span>
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
