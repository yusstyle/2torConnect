import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useListSessions, useListTransactions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Building2, DollarSign, Users, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function InvestorDashboard() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const { data: txData } = useListTransactions({ userId: user?.id, limit: 10 });
  const transactions = txData?.transactions ?? [];
  const totalFunded = transactions.reduce((s, t) => s + Number(t.amount), 0);

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
              <h2 className="text-white font-bold text-xl">Investor Dashboard</h2>
              <p className="text-white/60 text-sm">Fund students and tutors, attend live sessions, and grow the next generation.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Funded", value: `₦${totalFunded.toLocaleString()}`, icon: DollarSign, color: "text-yellow-400" },
            { label: "Transactions", value: transactions.length, icon: TrendingUp, color: "text-green-400" },
            { label: "Students Helped", value: "—", icon: Users, color: "text-accent" },
            { label: "Tutors Supported", value: "—", icon: Users, color: "text-primary" },
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Browse Students", desc: "Find students to fund", href: "/investor/students", color: "from-accent to-primary" },
            { label: "Browse Tutors", desc: "Support verified tutors", href: "/investor/tutors", color: "from-primary to-purple-600" },
            { label: "Live Sessions", desc: "Join ongoing sessions", href: "/investor/live", color: "from-yellow-500 to-orange-400" },
          ].map(action => (
            <motion.button key={action.label} whileHover={{ scale: 1.02 }} onClick={() => setLocation(action.href)}
              className={`glass-panel rounded-2xl p-5 text-left bg-gradient-to-br ${action.color} bg-opacity-10 hover:border-white/20 transition-all group`}>
              <p className="text-white font-bold mb-1">{action.label}</p>
              <p className="text-white/60 text-xs mb-3">{action.desc}</p>
              <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ))}
        </div>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
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
