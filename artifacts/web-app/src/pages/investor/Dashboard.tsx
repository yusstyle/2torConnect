import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Building2, DollarSign, TrendingUp, ArrowRight, Clock, GraduationCap, Sparkles, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export default function SponsorDashboard() {
  const { user, token } = useAuthStore();
  const [, setLocation] = useLocation();
  const { data: txData } = useListTransactions({ userId: user?.id, limit: 10 });
  const transactions = txData?.transactions ?? [];
  const totalFunded = transactions.reduce((s, t) => s + Number(t.amount), 0);

  const { data: uniData } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ active: any[]; featured: any[] }>;
    },
    staleTime: 60_000,
  });

  const activeUniversities = uniData?.active ?? [];
  const totalStudents = activeUniversities.reduce((s: number, u: any) => s + (u.studentsCount ?? 0), 0);
  const totalTutors = activeUniversities.reduce((s: number, u: any) => s + (u.tutorsCount ?? 0), 0);

  return (
    <DashboardLayout role="investor" title={`Welcome, ${user?.name?.split(" ")[0]}!`}>
      <div className="space-y-6">

        {user?.status === "pending" && (
          <div className="glass-panel rounded-2xl p-5 border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold">Account Under Review</p>
              <p className="text-muted-foreground text-sm">Your ID is being verified by our team. You'll be notified once approved — usually within 24–48 hours.</p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,179,8,0.1),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Sponsor Dashboard</h2>
              <p className="text-white/60 text-sm">Invest in universities — our system automatically identifies and rewards the top 10 most active students and tutors.</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="glass-panel rounded-2xl p-6 border border-yellow-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-bold">How Sponsorship Works</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", icon: GraduationCap, title: "Choose a University", desc: "Browse active universities and select one to sponsor." },
              { step: "2", icon: Sparkles, title: "System Auto-Selects", desc: "Our algorithm ranks the top 10 most active tutors and students per school." },
              { step: "3", icon: Trophy, title: "Funds Distributed", desc: "Your sponsorship is split automatically among the top performers." },
            ].map(item => (
              <div key={item.step} className="flex gap-3 p-4 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">{item.step}</div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-muted-foreground text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sponsored", value: `₦${totalFunded.toLocaleString()}`, icon: DollarSign, color: "text-yellow-400" },
            { label: "Transactions", value: transactions.length, icon: TrendingUp, color: "text-green-400" },
            { label: "Active Students", value: totalStudents, icon: Users, color: "text-accent" },
            { label: "Active Tutors", value: totalTutors, icon: GraduationCap, color: "text-primary" },
          ].map(stat => (
            <div key={stat.label} className="glass-panel rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button whileHover={{ scale: 1.02 }} onClick={() => setLocation("/investor/universities")}
          className="w-full glass-panel rounded-2xl p-6 text-left bg-gradient-to-br from-yellow-500/10 to-orange-500/10 hover:border-yellow-500/30 transition-all group border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Sponsor a University</p>
                <p className="text-white/60 text-sm">{activeUniversities.length > 0 ? `${activeUniversities.length} active universit${activeUniversities.length !== 1 ? "ies" : "y"} available` : "Browse universities ready for sponsorship"}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Sponsorships</h3>
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20">
                  <div>
                    <p className="text-white text-sm font-medium">{tx.description ?? tx.type}</p>
                    <p className="text-muted-foreground text-xs">{format(new Date(tx.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                  <span className="text-yellow-400 font-bold">₦{Number(tx.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
