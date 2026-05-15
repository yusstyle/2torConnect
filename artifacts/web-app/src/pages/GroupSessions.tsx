import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { Users, Video, PlusCircle, Loader2, Calendar, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface GroupSession {
  id: number; subject: string; scheduledAt: string; durationMinutes: number;
  maxStudents: number; notes?: string; tutorId: number; tutorName: string;
  tutorAvatar?: string; amount?: string; joinedCount: number;
}

export default function GroupSessionsPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useState("");

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const role = user?.role ?? "student";

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/groups`, { headers });
      const d = await r.json();
      setSessions(Array.isArray(d) ? d : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const join = async (id: number) => {
    setJoining(id);
    try {
      const r = await fetch(`${API}/groups/${id}/join`, { method: "POST", headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      toast({ title: "Joined!", description: "You've joined the group session." });
      window.location.href = `/session/${id}`;
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally { setJoining(null); }
  };

  return (
    <DashboardLayout role={role} title="Group Sessions">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-xl">Group Study Sessions</h2>
            <p className="text-muted-foreground text-sm">Join a live group session and learn with others</p>
          </div>
          {role === "tutor" && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90"
            >
              <PlusCircle className="w-4 h-4" /> Create Group
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-white font-bold mb-1">No group sessions open</p>
            <p className="text-muted-foreground text-sm">
              {role === "tutor" ? "Create a group session for multiple students to join." : "Check back later — tutors will open group sessions here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s, i) => {
              const spots = s.maxStudents - s.joinedCount;
              const isFull = spots <= 0;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-bold">{s.subject}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isFull ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {isFull ? "Full" : `${spots} spot${spots !== 1 ? "s" : ""} left`}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      with <strong className="text-white">{s.tutorName}</strong>
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(s.scheduledAt), "MMM d, h:mm a")}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.joinedCount}/{s.maxStudents} joined</span>
                      {s.amount && <span className="text-accent font-bold">₦{s.amount}/person</span>}
                    </div>
                    {s.notes && <p className="text-muted-foreground text-xs mt-1.5 line-clamp-1">{s.notes}</p>}
                  </div>
                  {role === "student" && (
                    <button
                      onClick={() => join(s.id)}
                      disabled={isFull || joining === s.id}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {joining === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                      {isFull ? "Full" : "Join"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && role === "tutor" && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} headers={headers} />
      )}
    </DashboardLayout>
  );
}

function CreateGroupModal({ onClose, onCreated, headers }: { onClose: () => void; onCreated: () => void; headers: any }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ subject: "", date: "", time: "", duration: "60", maxStudents: "5", notes: "", amount: "" });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/groups`, {
        method: "POST", headers,
        body: JSON.stringify({
          subject: form.subject,
          scheduledAt,
          durationMinutes: Number(form.duration),
          maxStudents: Number(form.maxStudents),
          notes: form.notes || undefined,
          amount: form.amount ? Number(form.amount) : undefined,
        }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "Group session created!", description: "Students can now find and join your session." });
      onCreated();
    } catch { toast({ variant: "destructive", title: "Failed to create session" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-lg rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Group Session</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Subject</label>
            <input required value={form.subject} onChange={e => set("subject", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" placeholder="e.g. Introduction to Calculus" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Date</label>
              <input type="date" required value={form.date} onChange={e => set("date", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Time</label>
              <input type="time" required value={form.time} onChange={e => set("time", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => set("duration", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" min={15} />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Max Students</label>
              <input type="number" value={form.maxStudents} onChange={e => set("maxStudents", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" min={2} max={50} />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Price (₦)</label>
              <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm" placeholder="0 = free" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm resize-none" placeholder="What will be covered in this session?" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Session"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
