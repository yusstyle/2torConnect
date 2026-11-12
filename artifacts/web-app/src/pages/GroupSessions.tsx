import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Users,
  Video,
  PlusCircle,
  Loader2,
  Calendar,
  Clock,
  X,
  Share2,
  Sparkles,
  Check,
  UserPlus,
  Trash2,
  Mail,
  AlertCircle,
  AtSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { shareGroupSessionToWhatsApp } from "@/lib/whatsapp";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface GroupSession {
  id: number;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  maxStudents: number;
  notes?: string;
  tutorId: number;
  tutorName: string;
  tutorUsername?: string;
  tutorAvatar?: string;
  amount?: string;
  joinedCount: number;
}

interface GroupInvitation {
  participantId: number;
  status: string;
  invitedAt: string;
  sessionId: number;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  maxStudents: number;
  notes?: string;
  amount?: string;
  tutorId: number;
  tutorName: string;
  tutorUsername?: string;
  tutorAvatar?: string;
}

interface Participant {
  id: number;
  studentId: number;
  status: "pending" | "accepted" | "declined";
  joinedAt: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

export default function GroupSessionsPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedManageSession, setSelectedManageSession] = useState<GroupSession | null>(null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const role = user?.role ?? "student";

  const loadSessions = async () => {
    try {
      const r = await fetch(`${API}/groups`, { headers });
      const d = await r.json();
      setSessions(Array.isArray(d) ? d : []);
    } catch {
      // silently ignore
    }
  };

  const loadInvitations = async () => {
    if (!token) return;
    setLoadingInvites(true);
    try {
      const r = await fetch(`${API}/groups/my-invitations`, { headers });
      const d = await r.json();
      setInvitations(Array.isArray(d) ? d : []);
    } catch {
      // silently ignore
    } finally {
      setLoadingInvites(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSessions(), loadInvitations()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [token]);

  // Student responds (approve/decline) to group invitation
  const handleRespond = async (sessionId: number, action: "approve" | "decline") => {
    setRespondingId(sessionId);
    try {
      const r = await fetch(`${API}/groups/${sessionId}/respond`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed to ${action} invitation`);

      if (action === "approve") {
        toast({
          title: "Invitation Approved! 🎉",
          description: "You have joined this study group session.",
        });
        // Optimistically remove from pending invites & refresh
        setInvitations((prev) => prev.filter((inv) => inv.sessionId !== sessionId));
        loadSessions();
      } else {
        toast({
          title: "Invitation Declined",
          description: "The group invitation has been removed.",
        });
        setInvitations((prev) => prev.filter((inv) => inv.sessionId !== sessionId));
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: e.message || "Could not process response",
      });
    } finally {
      setRespondingId(null);
    }
  };

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
    } finally {
      setJoining(null);
    }
  };

  return (
    <DashboardLayout role={role} title="Group Sessions">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-white font-extrabold text-xl sm:text-2xl tracking-tight">Group Study Sessions</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              Collaborative exam prep and peer masterclasses with campus tutors
            </p>
          </div>
          {role === "tutor" && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Create Group</span>
            </button>
          )}
        </div>

        {/* 1. Student Pending Invitations Banner / Cards */}
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Pending Group Invitations ({invitations.length})
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">Approve to join or decline</span>
            </div>

            <div className="space-y-3">
              {invitations.map((inv) => {
                const isBusy = respondingId === inv.sessionId;
                return (
                  <div
                    key={inv.participantId}
                    className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-sm">
                        {inv.tutorAvatar ? (
                          <img
                            src={inv.tutorAvatar}
                            alt={inv.tutorName}
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          inv.tutorName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-white font-bold text-sm sm:text-base leading-tight">
                            {inv.subject}
                          </h4>
                          {inv.amount ? (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              ₦{inv.amount}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
                              Free Group
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Invited by <strong className="text-white">{inv.tutorName}</strong>
                          {inv.tutorUsername && (
                            <span className="text-emerald-400/90 ml-1">(@{inv.tutorUsername})</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            {format(new Date(inv.scheduledAt), "EEE, MMM d • h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            {inv.durationMinutes} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            Max {inv.maxStudents} students
                          </span>
                        </div>
                        {inv.notes && (
                          <p className="text-xs text-white/70 mt-2 bg-white/5 p-2 rounded-xl border border-white/5 line-clamp-2">
                            "{inv.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto">
                      <button
                        onClick={() => handleRespond(inv.sessionId, "decline")}
                        disabled={isBusy}
                        className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-red-500/30 hover:bg-red-500/15 active:scale-95 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                      <button
                        onClick={() => handleRespond(inv.sessionId, "approve")}
                        disabled={isBusy}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                        <span>Approve & Join</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 2. All Open Group Sessions */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-muted-foreground text-xs font-medium">Loading group sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 px-4 glass-panel rounded-3xl border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3.5 text-muted-foreground">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-white font-bold text-base mb-1">No Group Sessions Available</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">
              {role === "tutor"
                ? "Create a group session above and add students using their usernames."
                : "Check back soon or ask your tutor to invite you to their study group by your username."}
            </p>
            {role === "tutor" && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Create First Group
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Available Study Sessions ({sessions.length})</span>
              <span>Live & Scheduled</span>
            </div>

            {sessions.map((s, i) => {
              const spots = s.maxStudents - s.joinedCount;
              const isFull = spots <= 0;
              const isHostTutor = user?.id === s.tutorId;

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                      <Video className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-white font-bold text-base tracking-tight">{s.subject}</h3>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                            isFull
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {isFull ? "Full" : `${spots} spot${spots !== 1 ? "s" : ""} left`}
                        </span>
                        {isHostTutor && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            Your Group
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground text-xs">
                        Tutor: <strong className="text-white">{s.tutorName}</strong>
                        {s.tutorUsername && (
                          <span className="text-emerald-400/90 ml-1">(@{s.tutorUsername})</span>
                        )}
                      </p>

                      <div className="flex items-center gap-3.5 mt-2.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white/50" />
                          {format(new Date(s.scheduledAt), "MMM d, h:mm a")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-white/50" />
                          {s.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-white/50" />
                          {s.joinedCount}/{s.maxStudents} joined
                        </span>
                        {s.amount ? (
                          <span className="text-emerald-400 font-bold">₦{s.amount}/seat</span>
                        ) : (
                          <span className="text-teal-400 font-semibold">Free</span>
                        )}
                      </div>

                      {s.notes && (
                        <p className="text-muted-foreground text-xs mt-2 line-clamp-1 italic">
                          "{s.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5 flex-wrap sm:flex-nowrap">
                    {/* Host Tutor: Manage & Invite by username button */}
                    {isHostTutor ? (
                      <>
                        <button
                          onClick={() => setSelectedManageSession(s)}
                          className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                          title="Invite students with username"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add by Username</span>
                        </button>

                        <button
                          onClick={() => shareGroupSessionToWhatsApp(s)}
                          className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center gap-1 text-xs font-semibold"
                          title="Share to WhatsApp Course Group"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        <a
                          href={`/session/${s.id}`}
                          className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                        >
                          <Video className="w-4 h-4" />
                          <span>Start Room</span>
                        </a>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => shareGroupSessionToWhatsApp(s)}
                          className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center gap-1 text-xs font-semibold"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {role === "student" && (
                          <button
                            onClick={() => join(s.id)}
                            disabled={isFull || joining === s.id}
                            className="flex-1 md:flex-none justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                          >
                            {joining === s.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Users className="w-4 h-4 stroke-[2.5]" />
                            )}
                            {isFull ? "Full" : "Join Session"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && role === "tutor" && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadAll();
          }}
          headers={headers}
        />
      )}

      {/* Tutor Manage Group & Add by Username Modal */}
      {selectedManageSession && (
        <ManageGroupMembersModal
          session={selectedManageSession}
          onClose={() => setSelectedManageSession(null)}
          onUpdated={() => {
            loadSessions();
          }}
          headers={headers}
        />
      )}
    </DashboardLayout>
  );
}

// ----------------------------------------------------
// Modal: Create Group Session with Username Invitations
// ----------------------------------------------------
function CreateGroupModal({
  onClose,
  onCreated,
  headers,
}: {
  onClose: () => void;
  onCreated: () => void;
  headers: any;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    subject: "",
    date: "",
    time: "",
    duration: "60",
    maxStudents: "10",
    notes: "",
    amount: "",
  });
  const [invitedUsernames, setInvitedUsernames] = useState<string[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const addUsername = () => {
    const clean = usernameInput.trim().replace(/^@+/, "");
    if (!clean) return;
    if (invitedUsernames.includes(clean)) {
      toast({ title: "Already added", description: `@${clean} is already in the invite list.` });
      return;
    }
    setInvitedUsernames((prev) => [...prev, clean]);
    setUsernameInput("");
  };

  const removeUsername = (uname: string) => {
    setInvitedUsernames((prev) => prev.filter((u) => u !== uname));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const r = await fetch(`${API}/groups`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject: form.subject,
          scheduledAt,
          durationMinutes: Number(form.duration),
          maxStudents: Number(form.maxStudents),
          notes: form.notes || undefined,
          amount: form.amount ? Number(form.amount) : undefined,
          inviteUsernames: invitedUsernames,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create group session");

      const count = d.invitedUsernames?.length ?? invitedUsernames.length;
      toast({
        title: "Group session created! 🎉",
        description:
          count > 0
            ? `Session created and invitations sent to ${count} student(s) to approve or decline.`
            : "Students can now find and join your group session.",
      });
      onCreated();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to create session",
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-white">Create Group Session</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Host a multi-student masterclass and invite students by username
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Subject / Topic Title
            </label>
            <input
              required
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none text-sm transition-colors"
              placeholder="e.g. MTH 101 Calculus Exam Preparation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">Time</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">Duration (min)</label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                min={15}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">Max Students</label>
              <input
                type="number"
                value={form.maxStudents}
                onChange={(e) => set("maxStudents", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                min={2}
                max={100}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">Price (₦)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                placeholder="0 = free"
              />
            </div>
          </div>

          {/* Invite Students by Username only */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Invite Students by Username (Optional)</span>
              </label>
              <span className="text-[10px] text-muted-foreground">Username only</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
                  @
                </span>
                <input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUsername();
                    }
                  }}
                  placeholder="username (e.g. yusstyle)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none text-xs"
                />
              </div>
              <button
                type="button"
                onClick={addUsername}
                className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-all"
              >
                + Add
              </button>
            </div>

            {/* Display added username pills */}
            {invitedUsernames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {invitedUsernames.map((uname) => (
                  <span
                    key={uname}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium"
                  >
                    @{uname}
                    <button
                      type="button"
                      onClick={() => removeUsername(uname)}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Type a student's username and press Add. Invited students can Approve or Decline the invite.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Session Outline & Notes (Optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none text-xs resize-none"
              placeholder="What questions, topics or materials will be solved in this session?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-semibold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Send Invites"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------
// Modal: Tutor Manages Group Members & Invites by Username
// ----------------------------------------------------
function ManageGroupMembersModal({
  session,
  onClose,
  onUpdated,
  headers,
}: {
  session: GroupSession;
  onClose: () => void;
  onUpdated: () => void;
  headers: any;
}) {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadParticipants = async () => {
    try {
      setLoadingList(true);
      const r = await fetch(`${API}/groups/${session.id}/participants`, { headers });
      const d = await r.json();
      setParticipants(Array.isArray(d) ? d : []);
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [session.id]);

  const handleInviteUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = usernameInput.trim().replace(/^@+/, "");
    if (!clean) {
      toast({ variant: "destructive", title: "Username required", description: "Please enter a valid student username." });
      return;
    }

    setInviting(true);
    try {
      const r = await fetch(`${API}/groups/${session.id}/invite`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: clean }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to invite student");

      toast({
        title: "Invitation Sent! 🚀",
        description: `Invitation delivered to @${clean}. The student can now approve or decline.`,
      });
      setUsernameInput("");
      loadParticipants();
      onUpdated();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could Not Invite",
        description: err.message,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (studentId: number, name: string) => {
    setRemovingId(studentId);
    try {
      const r = await fetch(`${API}/groups/${session.id}/participants/${studentId}`, {
        method: "DELETE",
        headers,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to remove participant");

      toast({ title: "Removed", description: `${name} has been removed from this group.` });
      setParticipants((prev) => prev.filter((p) => p.studentId !== studentId));
      onUpdated();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setRemovingId(null);
    }
  };

  const acceptedCount = participants.filter((p) => p.status === "accepted").length;
  const pendingCount = participants.filter((p) => p.status === "pending").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{session.subject}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage group participants & invite students by username
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite by username bar */}
        <form onSubmit={handleInviteUser} className="mb-4 shrink-0">
          <label className="block text-xs font-semibold text-white/80 mb-1.5">
            Add Student by Username Only
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
                @
              </span>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username (e.g. yusstyle)"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={inviting || !usernameInput.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {inviting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>Invite</span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Student will see this in their "Pending Invitations" and can approve or decline.
          </p>
        </form>

        {/* Summary Counter */}
        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white/5 border border-white/5 mb-3 shrink-0">
          <span className="text-white font-medium">
            Confirmed: <strong className="text-emerald-400">{acceptedCount}</strong> / {session.maxStudents}
          </span>
          {pendingCount > 0 && (
            <span className="text-amber-400 font-medium">
              Pending: <strong>{pendingCount}</strong>
            </span>
          )}
        </div>

        {/* Participants list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No students added yet. Type a username above to send an invitation.
            </div>
          ) : (
            participants.map((p) => {
              const isPending = p.status === "pending";
              const isDeclined = p.status === "declined";
              const isAccepted = p.status === "accepted";

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        p.name?.slice(0, 2).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.username ? `@${p.username}` : "student"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Pending ⏳
                      </span>
                    )}
                    {isDeclined && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Declined
                      </span>
                    )}

                    <button
                      onClick={() => handleRemove(p.studentId, p.name)}
                      disabled={removingId === p.studentId}
                      className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={isPending ? "Cancel invitation" : "Remove participant"}
                    >
                      {removingId === p.studentId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 mt-2 border-t border-white/5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
