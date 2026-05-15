import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { BookOpen, Loader2, Send, ChevronDown, ChevronUp, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface Assignment {
  id: number; studentId: number; studentName: string; subject: string; title: string;
  description: string; deadline?: string; status: string; createdAt: string; responseCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  answered: "bg-green-500/20 text-green-400 border border-green-500/30",
  closed: "bg-white/10 text-muted-foreground border border-white/10",
};

export default function TutorAssignmentsPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<number | null>(null);

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/assignments`, { headers });
        const d = await r.json();
        setAssignments(Array.isArray(d) ? d : []);
      } catch { toast({ variant: "destructive", title: "Failed to load questions" }); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const reply = async (id: number) => {
    const response = replyMap[id]?.trim();
    if (!response) return;
    setSending(id);
    try {
      const r = await fetch(`${API}/assignments/${id}/respond`, {
        method: "POST", headers,
        body: JSON.stringify({ response }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "Answer posted!", description: "The student has been notified." });
      setReplyMap(p => ({ ...p, [id]: "" }));
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: "answered", responseCount: a.responseCount + 1 } : a));
    } catch { toast({ variant: "destructive", title: "Failed to post answer" }); }
    finally { setSending(null); }
  };

  return (
    <DashboardLayout role="tutor" title="Assignments Board">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="mb-2">
          <h2 className="text-white font-bold text-xl">Open Questions</h2>
          <p className="text-muted-foreground text-sm">Students waiting for help from tutors like you</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-white font-bold">No open questions</p>
            <p className="text-muted-foreground text-sm">Check back later — students will post questions here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_STYLES[a.status] || STATUS_STYLES.open}`}>{a.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{a.subject}</span>
                        {a.responseCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {a.responseCount}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold">{a.title}</h3>
                      <p className="text-muted-foreground text-sm mt-0.5">by {a.studentName} · {format(new Date(a.createdAt), "MMM d")}</p>
                    </div>
                    {expanded === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === a.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
                        <p className="text-foreground text-sm leading-relaxed">{a.description}</p>
                        {a.deadline && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Deadline: {format(new Date(a.deadline), "MMM d, yyyy")}</p>}

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">Your Answer</label>
                          <textarea
                            value={replyMap[a.id] || ""}
                            onChange={e => setReplyMap(p => ({ ...p, [a.id]: e.target.value }))}
                            rows={4}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none text-sm resize-none"
                            placeholder="Write a detailed, helpful answer..."
                          />
                          <button
                            onClick={() => reply(a.id)}
                            disabled={!replyMap[a.id]?.trim() || sending === a.id}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
                          >
                            {sending === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Post Answer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
