import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListSessions, useUpdateSession } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Video,
  DollarSign,
  BadgeCheck,
  CreditCard,
  X,
  Share2,
  Wallet,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";
import { pingSessionWhatsApp } from "@/lib/whatsapp";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

interface PayModalProps {
  sessionId: number;
  subject: string;
  amount: string | number | null;
  tutorName: string;
  onClose: () => void;
  onPaid: () => void;
}

function PayModal({ sessionId, subject, amount, tutorName, onClose, onPaid }: PayModalProps) {
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const { toast } = useToast();
  const { token } = useAuthStore();

  const numAmount = Number(amount ?? 0);

  // Option 2: Pay directly using Paystack (Visa, Mastercard, Verve, Transfer, USSD)
  const handlePayPaystack = async () => {
    setLoadingPaystack(true);
    try {
      const res = await fetch(`${getApiUrl()}/sessions/${sessionId}/paystack-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate Paystack checkout");
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: "Session Confirmed", description: data.message });
        onPaid();
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Paystack Failed to Launch", description: e.message });
      setLoadingPaystack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-4 border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
              <span>Pay for Session</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Real Payment
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select your preferred payment method</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session details */}
        <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Subject</span>
            <span className="text-white font-semibold truncate max-w-[200px]">{subject}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Tutor</span>
            <span className="text-white font-semibold">{tutorName}</span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total Fee</span>
            <span className="text-white font-extrabold text-xl text-emerald-400">
              ₦{numAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Option A: Pay with Card / Paystack */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-background to-black border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Pay with Debit Card / Bank</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30">
              VISA
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30">
              Mastercard
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
              Verve
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-600/30 text-cyan-300 border border-cyan-500/30">
              Bank Transfer
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 border border-amber-500/30">
              USSD
            </span>
          </div>

          <button
            onClick={handlePayPaystack}
            disabled={loadingPaystack}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {loadingPaystack ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-black" />}
            {loadingPaystack ? "Redirecting to Paystack…" : `Pay ₦${numAmount.toLocaleString()} with Paystack`}
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PCI-DSS Level 1 Certified • 100% Secure Checkout</span>
        </div>
      </div>
    </div>
  );
}

export default function StudentSessionsPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [payingSession, setPayingSession] = useState<any | null>(null);

  const { data, isLoading, refetch } = useListSessions({ studentId: user?.id });

  // Handle Paystack redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionPaid = params.get("sessionPaid");
    const ref = params.get("reference") || params.get("trxref");
    if (ref && token) {
      const url = new URL(window.location.href);
      url.searchParams.delete("sessionPaid");
      url.searchParams.delete("reference");
      url.searchParams.delete("trxref");
      window.history.replaceState({}, "", url.toString());

      fetch(`${getApiUrl()}/wallet/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference: ref }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            toast({
              title: "Payment Confirmed via Paystack! 🎉",
              description: d.message || "Your session is confirmed and unlocked. Your tutor has been notified.",
            });
            refetch();
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const cancelMutation = useUpdateSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session cancelled" });
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Failed to cancel" }),
    },
  });

  const sessions = data?.sessions ?? [];

  return (
    <DashboardLayout role="student" title="My Sessions">
      {payingSession && (
        <PayModal
          sessionId={payingSession.id}
          subject={payingSession.subject}
          amount={payingSession.amount}
          tutorName={payingSession.tutorName}
          onClose={() => setPayingSession(null)}
          onPaid={() => {
            setPayingSession(null);
            refetch();
          }}
        />
      )}

      <div className="space-y-4 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground text-xs mb-6 max-w-sm mx-auto">
              Book your first session with a verified campus tutor to get started.
            </p>
            <a
              href="/student/find-tutor"
              className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
            >
              Find a Tutor
            </a>
          </div>
        ) : (
          sessions.map((session) => {
            const isPaid = (session as any).isPaid === 1;

            return (
              <div
                key={session.id}
                className="glass-panel rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[session.status] ?? ""
                      }`}
                    >
                      {session.status}
                    </span>
                    {isPaid ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <BadgeCheck className="w-3.5 h-3.5" /> Paid Upfront
                      </span>
                    ) : null}
                    {session.status === "pending" && isPaid && (
                      <span className="text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting Tutor Approval
                      </span>
                    )}
                    <span className="text-white font-bold text-base tracking-tight">{session.subject}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Tutor: <strong className="text-white">{session.tutorName}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-white/50" />
                      {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-white/50" />
                      {format(new Date(session.scheduledAt), "h:mm a")} · {session.durationMinutes}min
                    </span>
                    {session.amount && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        ₦{Number(session.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <button
                    onClick={() =>
                      pingSessionWhatsApp({
                        partnerName: session.tutorName,
                        subject: session.subject,
                        time: format(new Date(session.scheduledAt), "MMM d, h:mm a"),
                        sessionId: session.id,
                        isTutor: false,
                      })
                    }
                    className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                    title="Notify tutor on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {!isPaid && session.status !== "cancelled" && Number(session.amount ?? 0) > 0 && (
                    <button
                      onClick={() => setPayingSession(session)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs hover:opacity-90 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>
                  )}

                  {session.status === "confirmed" && (
                    <a
                      href={`/session/${session.id}`}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </a>
                  )}

                  {session.status === "pending" && (
                    <button
                      onClick={() => {
                        const msg = isPaid
                          ? `Cancel this booking request? Your payment of ₦${Number(session.amount).toLocaleString()} will be automatically refunded to your wallet.`
                          : "Cancel this booking request?";
                        if (window.confirm(msg)) {
                          cancelMutation.mutate({ id: session.id, data: { status: "cancelled" } });
                        }
                      }}
                      className="p-2.5 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors text-xs font-semibold"
                      title="Cancel session"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
