import { useState } from "react";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Search, Loader2, CheckCircle, XCircle, Clock, FileImage, X, Eye, BadgeCheck, Mail, Send, Paperclip } from "lucide-react";
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

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [docUser, setDocUser] = useState<DocUser | null>(null);
  const [composeTarget, setComposeTarget] = useState<{ type: "single"; id: number; name: string } | { type: "all" } | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

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
          recipientType: composeTarget.type,
          userId: composeTarget.type === "single" ? composeTarget.id : undefined,
          subject: subject.trim(),
          message: message.trim(),
          mediaUrl,
          mediaType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      toast({ title: "Message sent", description: `Delivered to ${data.sent} recipient${data.sent === 1 ? "" : "s"}${data.failed ? `, ${data.failed} failed` : ""}` });
      setComposeTarget(null); setSubject(""); setMessage(""); setMediaFile(null); setMediaPreview(null);
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

  return (
    <DashboardLayout role="admin" title="User Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
            />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="tutor">Tutors</option>
            <option value="investor">Investors / Sponsors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{total} total users</span>
            <button
              onClick={() => setComposeTarget({ type: "all" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-xs font-medium transition-colors">
              <Mail className="w-3.5 h-3.5" /> Message All Users
            </button>
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
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/2 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium">{user.name}</span>
                        {user.isVerified && <VerifiedBadge />}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[user.role] ?? ""}`}>{user.role}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[user.status] ?? ""}`}>{user.status}</span>
                        {user.country && <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-muted-foreground">{user.country}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email} · Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</p>
                      {user.university && <p className="text-xs text-accent/70 mt-0.5">{user.university}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(user.role === "tutor" || user.role === "investor") && (
                        <button
                          onClick={() => toggleVerify(user.id, !user.isVerified)}
                          disabled={verifyingId === user.id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            user.isVerified ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
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
      {/* Compose message modal */}
      {composeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !sending && setComposeTarget(null)}>
          <div className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <p className="text-white font-bold">
                  {composeTarget.type === "all" ? "Message All Users" : `Message ${composeTarget.name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {composeTarget.type === "all" ? "This will email every registered user." : "This will email just this one user."}
                </p>
              </div>
              <button onClick={() => !sending && setComposeTarget(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Important update"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={6}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Attach image or video (optional)</label>
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
                  <label className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black/40 border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 cursor-pointer transition-all text-sm">
                    <Paperclip className="w-4 h-4" /> Choose image or video
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
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white hover:opacity-90 font-bold text-sm transition-all disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {uploadingMedia ? "Uploading..." : sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
