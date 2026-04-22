import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, BookOpen, GraduationCap, MessageSquare, CheckCircle, Clock, Video, Wrench, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface RealUser {
  id: number; name: string; email: string; status: string;
  avatarUrl?: string | null; university?: string | null; level?: string | null;
  subjects?: string[] | null; aboutYou?: string | null;
}

export default function InvestorTutors() {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["investor-tutors", search],
    queryFn: async () => {
      const params = new URLSearchParams({ role: "tutor", limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`${BASE}/api/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ users: RealUser[] }>;
    },
    staleTime: 30_000,
  });

  const tutors = data?.users ?? [];

  const startCall = (target: RealUser) => {
    if (!user) return;
    const room = `sponsor-${user.id}-${target.id}-${Date.now()}`;
    toast({ title: `Connecting with ${target.name}…`, description: "Opening video room" });
    setLocation(`/session/${room}`);
  };

  const provideTools = (target: RealUser) => {
    toast({
      title: `Equip ${target.name} with teaching tools`,
      description: "Sponsor a tablet, study materials, course access, or premium video tools. Payment coming soon.",
    });
  };

  return (
    <DashboardLayout role="investor" title="Sponsor Tutors">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-primary/20 via-primary/5 to-purple-500/10 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Empower Educators</h2>
              <p className="text-white/60 text-sm">Sponsor tutors with tools, devices, and stipends so they can teach the next generation.</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tutors by name…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl h-72 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-white font-bold mb-1">No tutors yet</p>
            <p className="text-muted-foreground text-sm">Check back soon — tutors are joining every day</p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">{tutors.length} tutor{tutors.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutors.map((tutor, i) => (
                <motion.div key={tutor.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-panel rounded-2xl p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-bold text-white text-lg shrink-0 overflow-hidden">
                      {tutor.avatarUrl
                        ? <img src={tutor.avatarUrl} alt={tutor.name} className="w-full h-full object-cover" />
                        : <span>{tutor.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{tutor.name}</p>
                      <p className="text-muted-foreground text-xs truncate">{tutor.email}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${tutor.status === "active" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                        {tutor.status === "active" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tutor.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 min-h-[60px]">
                    {tutor.university && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{tutor.university}{tutor.level ? ` · ${tutor.level}` : ""}</span>
                      </div>
                    )}
                    {tutor.subjects && tutor.subjects.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tutor.subjects.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                    {tutor.aboutYou && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{tutor.aboutYou}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => startCall(tutor)} title="Video call"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent/15 text-accent hover:bg-accent/25 text-xs font-bold transition-all">
                      <Video className="w-3.5 h-3.5" /> Call
                    </button>
                    <button onClick={() => setLocation("/messages")}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-medium transition-all">
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                    <button onClick={() => provideTools(tutor)} title="Provide tools & resources"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white text-xs font-bold hover:opacity-90 transition-all">
                      <Wrench className="w-3.5 h-3.5" /> Equip
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
