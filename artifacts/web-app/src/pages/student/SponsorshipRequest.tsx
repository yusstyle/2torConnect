import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HandCoins, Plus, Loader2, Trash2, CheckCircle, Clock, BookOpen,
  GraduationCap, Home, Laptop, Heart, HelpCircle, X
} from "lucide-react";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const CATEGORIES = [
  { value: "tuition", label: "Tuition Fees", icon: GraduationCap },
  { value: "accommodation", label: "Accommodation", icon: Home },
  { value: "books", label: "Books & Materials", icon: BookOpen },
  { value: "laptop", label: "Laptop / Device", icon: Laptop },
  { value: "health", label: "Health & Welfare", icon: Heart },
  { value: "general", label: "General Support", icon: HelpCircle },
];

interface SponsorshipPost {
  id: number; title: string; story: string; amountNeeded: string | null;
  category: string; university: string | null; status: string; createdAt: string;
  studentName: string; studentEmail: string; studentAvatar: string | null;
}

export default function SponsorshipRequestPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", story: "", amountNeeded: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-sponsorship-requests", user?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/sponsorship-requests?studentId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ requests: SponsorshipPost[] }>;
    },
    enabled: !!user?.id,
  });

  const posts = data?.requests ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Title is required" }); return; }
    if (!form.story.trim()) { toast({ variant: "destructive", title: "Please tell your story" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/sponsorship-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          story: form.story,
          amountNeeded: form.amountNeeded || null,
          category: form.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Sponsorship request posted!", description: "Sponsors can now see your request." });
      setShowForm(false);
      setForm({ title: "", story: "", amountNeeded: "", category: "general" });
      qc.invalidateQueries({ queryKey: ["my-sponsorship-requests"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to post", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/sponsorship-requests/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Request removed" });
      qc.invalidateQueries({ queryKey: ["my-sponsorship-requests"] });
    } catch {
      toast({ variant: "destructive", title: "Could not remove request" });
    }
  };

  const ic = "w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm";

  return (
    <DashboardLayout role="student" title="Sponsorship Requests">
      <div className="space-y-6">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,179,8,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
              <HandCoins className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-xl">Request Sponsorship</h2>
              <p className="text-white/60 text-sm">Post your story and let sponsors find you. Sponsors browse by university and fund the most active students.</p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 transition-all shadow-lg text-sm">
              <Plus className="w-4 h-4" /> Post Request
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Tell Your Story</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={ic} placeholder="e.g. Help me pay my final year tuition" maxLength={100} />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1.5">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => setForm(f => ({ ...f, category: c.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${form.category === c.value ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent"}`}>
                      <c.icon className="w-3.5 h-3.5 shrink-0" /> {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1.5">Your Story *</label>
                <textarea value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                  rows={5} className={`${ic} resize-none`}
                  placeholder="Tell sponsors about yourself — your goals, challenges, achievements, and what this sponsorship would mean to you..." />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1.5">Amount Needed (₦) <span className="text-muted-foreground font-normal">— Optional</span></label>
                <input type="number" value={form.amountNeeded} onChange={e => setForm(f => ({ ...f, amountNeeded: e.target.value }))}
                  className={ic} placeholder="e.g. 150000" min="0" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 disabled:opacity-50 transition-all text-sm shadow-lg">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><HandCoins className="w-4 h-4" /> Submit Request</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* My Posts */}
        <div>
          <h3 className="text-white font-bold text-base mb-4">My Sponsorship Posts</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="glass-panel rounded-2xl h-32 animate-pulse bg-white/5" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <HandCoins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-white font-bold mb-1">No posts yet</p>
              <p className="text-muted-foreground text-sm mb-4">Post your story so sponsors can discover and support you.</p>
              <button onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white font-bold text-sm hover:opacity-90 transition-all">
                Post My First Request
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => {
                const cat = CATEGORIES.find(c => c.value === post.category);
                return (
                  <motion.div key={post.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="glass-panel rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                          {cat ? <cat.icon className="w-4 h-4 text-yellow-400" /> : <HandCoins className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <div>
                          <p className="text-white font-bold">{post.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                            {post.university && <span className="text-xs text-accent/70">{post.university}</span>}
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${post.status === "open" ? "text-green-400 bg-green-400/10" : "text-muted-foreground bg-white/5"}`}>
                              {post.status === "open" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {post.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{post.story}</p>
                    {post.amountNeeded && (
                      <p className="text-yellow-400 font-bold text-sm mt-2">₦{Number(post.amountNeeded).toLocaleString()} needed</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
