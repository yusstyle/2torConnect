import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListSessions, useUpdateSession } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Video, DollarSign, BadgeCheck, CreditCard, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/sessions/${sessionId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: "USD" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Payment failed");
      }
      toast({
        title: "Payment successful!",
        description: `Your tutor ${tutorName} has been notified. You can now join the session.`,
      });
      onPaid();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Payment failed", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Confirm Payment</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subject</span>
            <span className="text-white font-medium">{subject}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tutor</span>
            <span className="text-white font-medium">{tutorName}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-white font-bold text-lg">${Number(amount ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-accent mb-1">Secure Payment</p>
          <p>Your tutor will be automatically notified once payment is confirmed. The session will unlock for you to join.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentSessionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [payingSession, setPayingSession] = useState<any | null>(null);

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
      {payingSession && (
        <PayModal
          sessionId={payingSession.id}
          subject={payingSession.subject}
          amount={payingSession.amount}
          tutorName={payingSession.tutorName}
          onClose={() => setPayingSession(null)}
          onPaid={() => { setPayingSession(null); refetch(); }}
        />
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-6">Book your first session with a tutor to get started.</p>
            <a href="/student/find-tutor"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-all">
              Find a Tutor
            </a>
          </div>
        ) : (
          sessions.map(session => {
            const isPaid = (session as any).isPaid === 1;

            return (
              <div key={session.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[session.status] ?? ""}`}>
                      {session.status}
                    </span>
                    {isPaid && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        <BadgeCheck className="w-3.5 h-3.5" /> Paid
                      </span>
                    )}
                    <span className="text-white font-semibold">{session.subject}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Tutor: <span className="text-white">{session.tutorName}</span></p>
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
                      <span className="flex items-center gap-1 text-accent font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {Number(session.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {session.notes && (
                    <p className="text-sm text-muted-foreground italic">"{session.notes}"</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {session.status === "pending" && (
                    <>
                      <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium px-2">
                        Waiting for tutor confirmation
                      </span>
                      <button
                        onClick={() => cancelMutation.mutate({ id: session.id, data: { status: "cancelled" } })}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  )}

                  {session.status === "confirmed" && !isPaid && session.amount && (
                    <button
                      onClick={() => setPayingSession(session)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-green-500/25"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay ${Number(session.amount).toLocaleString()} to Join
                    </button>
                  )}

                  {session.status === "confirmed" && !isPaid && !session.amount && (
                    <button
                      onClick={() => setLocation(`/session/${session.id}`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Video className="w-4 h-4" />
                      Join Session
                    </button>
                  )}

                  {session.status === "confirmed" && isPaid && (
                    <button
                      onClick={() => setLocation(`/session/${session.id}`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Video className="w-4 h-4" />
                      Join Session
                    </button>
                  )}

                  {session.status === "completed" && (
                    <span className="flex items-center gap-1 text-green-400 text-sm font-medium px-3 py-2">
                      <CheckCircle className="w-4 h-4" /> Completed
                    </span>
                  )}

                  {session.status === "cancelled" && (
                    <span className="flex items-center gap-1 text-red-400 text-sm font-medium px-3 py-2">
                      <XCircle className="w-4 h-4" /> Cancelled
                    </span>
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
