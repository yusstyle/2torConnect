import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { PlusCircle, BookOpen, Clock, CheckCircle2, MessageSquare, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface Assignment {
  id: number; studentId: number; subject: string; title: string;
  description: string; deadline?: string; status: "open" | "answered" | "closed";
  createdAt: string; responseCount: number;
}
interface Response { id: number; response: string; createdAt: string; tutorId: number; tutorName: string; tutorAvatar?: string; }

const STATUS_STYLES = {
  open: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  answered: "bg-green-500/20 text-green-400 border border-green-500/30",
  closed: "bg-white/10 text-muted-foreground border border-white/10",
};

export default function StudentAssignmentsPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, Response[]>>({});

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/assignments?mine=true`, { headers });
      const d = await r.json();
      setAssignments(Array.isArray(d) ? d : []);
    } catch { toast({ variant: "destructive", title: "Failed to load assignments" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!responses[id]) {
      try {
        const r = await fetch(`${API}/assignments/${id}`, { headers });
        const d = await r.json();
        setResponses(prev => ({ ...prev, [id]: d.responses || [] }));
      } catch {}
    }
  };

  const closeAssignment = async (id: number) => {
    try {
      await fetch(`${API}/assignments/${id}/close`, { method: "PATCH", headers });
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: "closed" } : a));
    } catch { toast({ variant: "destructive", title: "Failed to close" }); }
  };

  return (
    <DashboardLayout role="student" title="Assignments Board">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-bold text-xl">My Questions</h2>
            <p className="text-muted-foreground text-sm">Post questions and get answers from tutors</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Ask a Question
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-white font-bold mb-1">No questions yet</p>
            <p className="text-muted-foreground text-sm">Post a question and get help from qualified tutors</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="glass-panel rounded-2xl overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(a.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{a.subject}</span>
                        {a.responseCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {a.responseCount} answer{a.responseCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold leading-tight">{a.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{a.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {expanded === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{format(new Date(a.createdAt), "MMM d")}</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === a.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
                        <p className="text-foreground text-sm leading-relaxed">{a.description}</p>
                        {a.deadline && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Deadline: {format(new Date(a.deadline), "MMM d, yyyy")}</p>}

                        {(responses[a.id] || []).length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-white">Tutor Answers</p>
                            {(responses[a.id] || []).map(r => (
                              <div key={r.id} className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                                    {r.tutorName.charAt(0)}
                                  </div>
                                  <span className="text-white text-sm font-medium">{r.tutorName}</span>
                                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(r.createdAt), "MMM d")}</span>
                                </div>
                                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{r.response}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No answers yet — tutors will respond soon.</p>
                        )}

                        {a.status !== "closed" && (
                          <button onClick={() => closeAssignment(a.id)} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                            <X className="w-3 h-3" /> Mark as closed
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} headers={headers} />}
    </DashboardLayout>
  );
}

function CreateModal({ onClose, onCreated, headers }: { onClose: () => void; onCreated: () => void; headers: any }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ subject: "", title: "", description: "", deadline: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/assignments`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, deadline: form.deadline || undefined }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "Question posted!", description: "Tutors will respond shortly." });
      onCreated();
    } catch { toast({ variant: "destructive", title: "Failed to post question" }); }
    finally { setSaving(false); }
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-lg rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Post a Question</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Subject</label>
              <input required value={form.subject} onChange={e => set("subject", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" placeholder="e.g. Calculus" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Deadline (optional)</label>
              <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Question Title</label>
            <input required value={form.title} onChange={e => set("title", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" placeholder="Short summary of your question" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Full Description</label>
            <textarea required value={form.description} onChange={e => set("description", e.target.value)} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm resize-none" placeholder="Describe your question in detail..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Question"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
