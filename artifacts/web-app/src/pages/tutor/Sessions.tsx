import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { useListSessions, useUpdateSession } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Video, DollarSign, Youtube, Link2, X, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

interface ConfirmModalProps {
  sessionId: number;
  onClose: () => void;
  onConfirmed: () => void;
}

function ConfirmModal({ sessionId, onClose, onConfirmed }: ConfirmModalProps) {
  const [liveUrl, setLiveUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const body: any = { status: "confirmed" };
      if (liveUrl.trim()) body.liveUrl = liveUrl.trim();
      if (amount.trim()) body.amount = amount.trim();
      const res = await fetch(`${getApiUrl()}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Session confirmed", description: liveUrl ? "YouTube Live link saved." : "Students can now pay to join." });
      onConfirmed();
    } catch {
      toast({ variant: "destructive", title: "Could not confirm session" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-5 border border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Confirm Session</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Session Price (USD or local currency)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">Student must pay this before joining the session.</p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-400" /> YouTube Live Stream URL (optional)
            </label>
            <input
              type="url"
              value={liveUrl}
              onChange={e => setLiveUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Go Live on YouTube, copy your stream link and paste it here. Students will watch it inside 2torConnect.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TutorSessionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useListSessions({ tutorId: user?.id });

  const updateMutation = useUpdateSession({
    mutation: {
      onSuccess: () => { toast({ title: "Session updated" }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Failed to update session" }),
    },
  });

  const sessions = data?.sessions ?? [];

  return (
    <DashboardLayout role="tutor" title="My Sessions">
      {confirmingId !== null && (
        <ConfirmModal
          sessionId={confirmingId}
          onClose={() => setConfirmingId(null)}
          onConfirmed={() => { setConfirmingId(null); refetch(); }}
        />
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sessions yet</h3>
            <p className="text-muted-foreground">Sessions booked by students will appear here.</p>
          </div>
        ) : (
          sessions.map(session => {
            const isPaid = (session as any).isPaid === 1;
            const liveUrl = (session as any).liveUrl;

            return (
              <div key={session.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[session.status] ?? ""}`}>
                      {session.status}
                    </span>
                    {isPaid && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        <BadgeCheck className="w-3.5 h-3.5" /> Payment Received
                      </span>
                    )}
                    <span className="text-white font-semibold">{session.subject}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Student: <span className="text-white">{session.studentName}</span></p>
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
                      <span className="flex items-center gap-1 text-green-400 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {Number(session.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {liveUrl && (
                    <div className="flex items-center gap-2 text-xs text-red-400 mt-1">
                      <Youtube className="w-3.5 h-3.5" />
                      <span className="truncate max-w-xs">YouTube Live linked</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {session.status === "pending" && (
                    <>
                      <button onClick={() => setConfirmingId(session.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Confirm
                      </button>
                      <button onClick={() => updateMutation.mutate({ id: session.id, data: { status: "cancelled" } })} disabled={updateMutation.isPending}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}

                  {session.status === "confirmed" && isPaid && (
                    <>
                      <button
                        onClick={() => setLocation(`/session/${session.id}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <Video className="w-4 h-4" />
                        Start Session
                      </button>
                      <button onClick={() => updateMutation.mutate({ id: session.id, data: { status: "completed" } })} disabled={updateMutation.isPending}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Mark Complete
                      </button>
                    </>
                  )}

                  {session.status === "confirmed" && !isPaid && (
                    <span className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium px-3 py-2 bg-yellow-500/10 rounded-xl">
                      <Clock className="w-4 h-4" /> Awaiting Payment
                    </span>
                  )}

                  {session.status === "completed" && (
                    <span className="flex items-center gap-1 text-green-400 text-sm font-medium px-3 py-2">
                      <CheckCircle className="w-4 h-4" /> Completed
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
