import { useState, useEffect } from "react";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import {
  Search, Loader2, CheckCircle, XCircle, Clock, FileImage, X, Eye, BadgeCheck,
  Mail, Send, Paperclip, GraduationCap, Users as UsersIcon, Briefcase, Bell, AlertTriangle, ShieldCheck, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  suspended: "bg-red-500/20 text-red-400",
  rejected: "bg-gray-500/20 text-gray-400",
};

const roleColors: Record<string, string> = {
  student: "bg-blue-500/20 text-blue-400",
  tutor: "bg-purple-500/20 text-purple-400",
  investor: "bg-yellow-500/20 text-yellow-400",
  admin: "bg-accent/20 text-accent",
};

interface DocUser {
  id: number;
  name: string;
  role: string;
  documentUrl: string | null;
}

interface RecipientStats {
  activeStudents: number;
  activeTutors: number;
  activeInvestors: number;
  activeAll: number;
  total: number;
}

interface QueueStatus {
  pending: number;
  sentLastHour: number;
  totalSent: number;
  totalFailed: number;
  totalQueued: number;
  activeSubject?: string;
  nextRunInMinutes: number;
}

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [docUser, setDocUser] = useState<DocUser | null>(null);

  // Messaging & broadcast state
  const [composeTarget, setComposeTarget] = useState<
    | { type: "single"; id: number; name: string }
    | { type: "broadcast" }
    | null
  >(null);
  const [targetAudience, setTargetAudience] = useState<"students" | "tutors" | "investors" | "all">("students");
  const [activeOnly, setActiveOnly] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [recipientStats, setRecipientStats] = useState<RecipientStats | null>(null);

  // Queue background state
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchRecipientStats = async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/recipient-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecipientStats(data);
      }
    } catch (e) {
      console.warn("Could not load recipient stats", e);
    }
  };

  const fetchQueueStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE}/api/admin/email-queue-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data);
      }
    } catch (e) {
      console.warn("Could not load queue status", e);
    }
  };

  const triggerQueueProcessing = async () => {
    setProcessingQueue(true);
    try {
      const res = await fetch(`${BASE}/api/admin/process-email-queue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      toast({
        title: data.quotaHit ? "Hourly Limit Reached" : "Queue Processed",
        description: data.message || `Dispatched ${data.sent} emails.`,
      });
      fetchQueueStatus();
    } catch {
      toast({ variant: "destructive", title: "Failed to process queue" });
    } finally {
      setProcessingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (composeTarget) {
      fetchRecipientStats();
    }
  }, [composeTarget]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const sendMessage = async () => {
    if (!composeTarget || !subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaFile) {
        setUploadingMedia(true);
        const sigRes = await fetch(`${BASE}/api/social/upload-signature`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!sigRes.ok) throw new Error("Could not prepare media upload");
        const sig = await sigRes.json();

        const fd = new FormData();
        fd.append("file", mediaFile);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);

        const resourceType = mediaFile.type.startsWith("video") ? "video" : "image";
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
          { method: "POST", body: fd }
        );
        const cloudData = await cloudRes.json();
        setUploadingMedia(false);
        if (!cloudRes.ok || !cloudData.secure_url) {
          throw new Error(cloudData.error?.message || "Media upload failed");
        }
        mediaUrl = cloudData.secure_url;
        mediaType = mediaFile.type;
      }

      const res = await fetch(`${BASE}/api/admin/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientType: composeTarget.type === "single" ? "single" : targetAudience,
          userId: composeTarget.type === "single" ? composeTarget.id : undefined,
          subject: subject.trim(),
          message: message.trim(),
          mediaUrl,
          mediaType,
          activeOnly,
          sendInAppNotification: sendInApp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");

      toast({
        title: "Broadcast Initiated",
        description: data.message || `Dispatched ${data.sent} emails. Remaining queued to send automatically 85/hour!`,
      });

      setComposeTarget(null);
      setSubject("");
      setMessage("");
      setMediaFile(null);
      setMediaPreview(null);
      fetchQueueStatus();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send message", description: err?.message });
    } finally {
      setSending(false);
      setUploadingMedia(false);
    }
  };

  const { data, isLoading, refetch } = useListUsers(
    { search: search || undefined, role: (roleFilter as any) || undefined, page, limit: 20 }
  );

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => { toast({ title: "User updated" }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Failed to update user" }),
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  const activateUser = (id: number) => updateMutation.mutate({ id, data: { status: "active" } });
  const rejectUser = (id: number) => updateMutation.mutate({ id, data: { status: "rejected" } });
  const suspendUser = (id: number) => updateMutation.mutate({ id, data: { status: "suspended" } });

  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const toggleVerify = async (id: number, next: boolean) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`${BASE}/api/users/${id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: next }),
      });
      if (!res.ok) throw new Error();
      toast({ title: next ? "User verified" : "Verification removed" });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Failed to update verification" });
    } finally {
      setVerifyingId(null);
    }
  };

  const getDocUrl = (url: string | null) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `/api`;
  };

  const currentAudienceCount =
    targetAudience === "students"
      ? recipientStats?.activeStudents
      : targetAudience === "tutors"
      ? recipientStats?.activeTutors
      : targetAudience === "investors"
      ? recipientStats?.activeInvestors
      : recipientStats?.activeAll;

  return (
    <DashboardLayout role="admin" title="User Management">
      <div className="space-y-4">
        {/* Automated Email Queue Progress Banner */}
        {queueStatus && queueStatus.pending > 0 && (
          <div className="glass-panel p-4 rounded-2xl border border-accent/40 bg-gradient-to-r from-accent/15 via-background to-blue-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/20 text-accent">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">Automated Hourly Delivery in Progress</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent uppercase tracking-wider">
                      Auto-Sending
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {queueStatus.activeSubject ? `"${queueStatus.activeSubject}" — ` : ""}
                    Sending 85 emails automatically every hour to protect your email deliverability.
                  </p>
                </div>
              </div>
              <button
                onClick={triggerQueueProcessing}
                disabled={processingQueue}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-semibold text-xs transition-all border border-accent/30 disabled:opacity-50">
                {processingQueue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Trigger Next 85 Now
              </button>
            </div>

            <div className="pt-3 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Delivered: <strong className="text-white">{queueStatus.totalSent}</strong> / {queueStatus.totalQueued} emails sent
                </span>
                <span>
                  {queueStatus.pending} pending ({queueStatus.nextRunInMinutes > 0 ? `next auto-batch in ~${queueStatus.nextRunInMinutes}m` : "ready to send"})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((queueStatus.totalSent / Math.max(1, queueStatus.totalQueued)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-accent transition-all">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="tutor">Tutors</option>
            <option value="investor">Investors / Sponsors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{total} total registered users</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTargetAudience("students");
                  setComposeTarget({ type: "broadcast" });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors border border-blue-500/20">
                <GraduationCap className="w-3.5 h-3.5" /> Message Students
              </button>
              <button
                onClick={() => {
                  setTargetAudience("all");
                  setComposeTarget({ type: "broadcast" });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-xs font-semibold transition-colors border border-accent/20">
                <Mail className="w-3.5 h-3.5" /> Broadcast Message
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((user: any) => {
                const hasDoc = !!(user.documentUrl);
                return (
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{user.name}</span>
                          {user.isVerified && <VerifiedBadge size={14} />}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium ${roleColors[user.role] ?? "bg-white/10 text-white"}`}>
                            {user.role}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColors[user.status] ?? "bg-white/10 text-white"}`}>
                            {user.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.createdAt && (
                          <p className="text-[10px] text-muted-foreground/60">Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      {user.role === "tutor" && (
                        <button
                          onClick={() => toggleVerify(user.id, !user.isVerified)}
                          disabled={verifyingId === user.id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.isVerified ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                          }`}>
                          <BadgeCheck className="w-3.5 h-3.5" /> {user.isVerified ? "Verified" : "Verify"}
                        </button>
                      )}
                      {hasDoc && (
                        <button
                          onClick={() => setDocUser({ id: user.id, name: user.name, role: user.role, documentUrl: user.documentUrl })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View ID
                        </button>
                      )}
                      <button
                        onClick={() => setComposeTarget({ type: "single", id: user.id, name: user.name })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 text-xs font-medium transition-colors">
                        <Mail className="w-3.5 h-3.5" /> Message
                      </button>
                      {user.status !== "active" && (
                        <button onClick={() => activateUser(user.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {user.status === "active" && (
                        <button onClick={() => suspendUser(user.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                      {user.status === "pending" && (
                        <button onClick={() => rejectUser(user.id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                          <Clock className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors">
              Previous
            </button>
            <span className="px-4 py-2 text-muted-foreground text-sm">Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Document viewer modal */}
      {docUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDocUser(null)}>
          <div className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <p className="text-white font-bold">{docUser.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{docUser.role} — Uploaded ID Document</p>
              </div>
              <button onClick={() => setDocUser(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {docUser.documentUrl ? (
                docUser.documentUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <FileImage className="w-16 h-16 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">PDF document uploaded</p>
                    <a
                      href={getDocUrl(docUser.documentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
                    >
                      Open PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={getDocUrl(docUser.documentUrl)}
                    alt="ID Document"
                    className="w-full rounded-2xl object-contain max-h-96"
                    onError={e => { (e.target as HTMLImageElement).src = ""; }}
                  />
                )
              ) : (
                <p className="text-muted-foreground text-center py-8">No document uploaded</p>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => { updateMutation.mutate({ id: docUser.id, data: { status: "active" } }); setDocUser(null); }}
                disabled={updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold text-sm transition-all disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Approve User
              </button>
              <button
                onClick={() => { updateMutation.mutate({ id: docUser.id, data: { status: "rejected" } }); setDocUser(null); }}
                disabled={updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-sm transition-all disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Reject User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Compose Message / Broadcast Modal */}
      {composeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !sending && setComposeTarget(null)}>
          <div className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <p className="text-white font-bold text-base flex items-center gap-2">
                  {composeTarget.type === "single" ? (
                    <>
                      <Mail className="w-4 h-4 text-accent" /> Message {composeTarget.name}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-accent" /> Broadcast Announcement
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {composeTarget.type === "single"
                    ? "Deliver message directly via email and in-app notification."
                    : "Target specific groups with automatic hourly queue delivery."}
                </p>
              </div>
              <button onClick={() => !sending && setComposeTarget(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Audience Selector (when broadcast) */}
              {composeTarget.type === "broadcast" && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium block">Select Target Audience</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetAudience("students")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetAudience === "students"
                          ? "border-blue-500/50 bg-blue-500/15 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}>
                      <p className="text-xs font-bold flex items-center gap-1.5 text-blue-400">
                        <GraduationCap className="w-3.5 h-3.5" /> Students
                      </p>
                      <p className="text-[11px] text-white/80 mt-1 font-medium">
                        {recipientStats ? `${recipientStats.activeStudents} active` : "Loading..."}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetAudience("tutors")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetAudience === "tutors"
                          ? "border-purple-500/50 bg-purple-500/15 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}>
                      <p className="text-xs font-bold flex items-center gap-1.5 text-purple-400">
                        <UsersIcon className="w-3.5 h-3.5" /> Tutors
                      </p>
                      <p className="text-[11px] text-white/80 mt-1 font-medium">
                        {recipientStats ? `${recipientStats.activeTutors} active` : "Loading..."}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetAudience("all")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetAudience === "all"
                          ? "border-accent/50 bg-accent/15 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}>
                      <p className="text-xs font-bold flex items-center gap-1.5 text-accent">
                        <Mail className="w-3.5 h-3.5" /> All Users
                      </p>
                      <p className="text-[11px] text-white/80 mt-1 font-medium">
                        {recipientStats ? `${recipientStats.activeAll} active` : "Loading..."}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetAudience("investors")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetAudience === "investors"
                          ? "border-yellow-500/50 bg-yellow-500/15 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}>
                      <p className="text-xs font-bold flex items-center gap-1.5 text-yellow-400">
                        <Briefcase className="w-3.5 h-3.5" /> Investors
                      </p>
                      <p className="text-[11px] text-white/80 mt-1 font-medium">
                        {recipientStats ? `${recipientStats.activeInvestors} active` : "Loading..."}
                      </p>
                    </button>
                  </div>

                  {/* Guaranteed in-app banner */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                      <Bell className="w-3.5 h-3.5" />
                      <span>Guaranteed Dashboard Notification Included</span>
                    </div>
                    <p className="text-[11px] text-blue-300/80 leading-relaxed">
                      100% of the targeted audience ({currentAudienceCount ?? "all"} users) will instantly receive this notification in their dashboard bell.
                    </p>
                  </div>

                  {/* Automated Hourly Queue Explanation Banner */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Automated Hourly Delivery Active</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                      Batch 1 (first 85 emails) sends immediately. If there are more students, the platform automatically queues the rest and sends 85 every hour in the background until 100% complete. You do not need to do anything manually!
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Important Announcement: New Study Materials Available"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Message Body</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all resize-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Attach image or video (optional)</label>
                {mediaPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    {mediaFile?.type.startsWith("video") ? (
                      <video src={mediaPreview} className="w-full max-h-48 object-cover" controls />
                    ) : (
                      <img src={mediaPreview} className="w-full max-h-48 object-cover" alt="" />
                    )}
                    <button
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black/40 border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 cursor-pointer transition-all text-xs">
                    <Paperclip className="w-4 h-4" /> Choose image or video attachment
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setComposeTarget(null)}
                disabled={sending}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 font-bold text-sm transition-all disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={sending || !subject.trim() || !message.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white hover:opacity-90 font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-accent/25">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {uploadingMedia ? "Uploading..." : sending ? "Broadcasting..." : composeTarget.type === "broadcast" && currentAudienceCount ? `Deliver to ${targetAudience === "students" ? "Students" : targetAudience}` : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
