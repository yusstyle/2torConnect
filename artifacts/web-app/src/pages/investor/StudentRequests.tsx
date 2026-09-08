import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import {
  HandCoins, Search, MessageCircle, GraduationCap, Home, BookOpen,
  Laptop, Heart, HelpCircle, Clock,
} from "lucide-react";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const CATEGORIES = [
  { value: "all", label: "All", icon: HandCoins },
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
  studentId: number; studentName: string; studentEmail: string; studentAvatar: string | null;
}

export default function InvestorStudentRequestsPage() {
  const { token } = useAuthStore();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["all-sponsorship-requests"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/sponsorship-requests?status=open`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ requests: SponsorshipPost[] }>;
    },
  });

  const posts = data?.requests ?? [];

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchesCategory = category === "all" || p.category === category;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.story.toLowerCase().includes(q) ||
        p.studentName?.toLowerCase().includes(q) ||
        p.university?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, category, search]);

  const handleMessage = (studentId: number, studentName: string) => {
    setLocation(`/messages?with=${studentId}&name=${encodeURIComponent(studentName)}`);
  };

  return (
    <DashboardLayout role="investor" title="Student Requests">
      <div className="space-y-6">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,179,8,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg shrink-0">
              <HandCoins className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg sm:text-xl">Student Requests</h2>
              <p className="text-white/60 text-sm">Browse students asking for help and see exactly what they need it for.</p>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student, title, university..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${category === c.value ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent"}`}>
                <c.icon className="w-3.5 h-3.5 shrink-0" /> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="glass-panel rounded-2xl h-36 animate-pulse bg-white/5" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <HandCoins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-bold mb-1">No requests found</p>
            <p className="text-muted-foreground text-sm">
              {posts.length === 0 ? "No students have posted a request yet." : "Try a different search or category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post, i) => {
              const cat = CATEGORIES.find(c => c.value === post.category);
              return (
                <motion.div key={post.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-panel rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {post.studentAvatar ? (
                        <img src={post.studentAvatar} alt={post.studentName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                          {cat ? <cat.icon className="w-4 h-4 text-yellow-400" /> : <HandCoins className="w-4 h-4 text-yellow-400" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate">{post.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-accent font-medium">{post.studentName}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                          {post.university && <span className="text-xs text-muted-foreground">{post.university}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleMessage(post.studentId, post.studentName)}
                      className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 transition-all shadow-lg">
                      <MessageCircle className="w-3.5 h-3.5" /> Message
                    </button>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{post.story}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {post.amountNeeded && (
                      <p className="text-yellow-400 font-bold text-sm">₦{Number(post.amountNeeded).toLocaleString()} needed</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-green-400 bg-green-400/10">
                      <Clock className="w-3 h-3" /> {post.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}