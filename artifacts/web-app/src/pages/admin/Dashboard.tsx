import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Users, GraduationCap, BookOpen, CreditCard, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ROLE_COLORS: Record<string, string> = {
  student: "hsl(var(--accent))",
  tutor: "hsl(var(--primary))",
  admin: "#ef4444",
  investor: "#f59e0b",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  const chartData = (stats as any)?.chartData ?? [];
  const recentUsers = (stats as any)?.recentUsers ?? [];
  const roleBreakdown = (stats as any)?.roleBreakdown ?? [];

  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Admin Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Platform Overview">
      <div className="mb-6">
        <p className="text-muted-foreground">Monitor activity and metrics across 2torConnect.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard title="Active Tutors" value={stats?.totalTutors || 0} icon={GraduationCap} color="text-primary" bg="bg-primary/20" />
        <StatCard title="Total Sessions" value={stats?.totalSessions || 0} icon={BookOpen} color="text-accent" bg="bg-accent/20" />
        <StatCard title="Revenue" value={`₦${Number(stats?.totalRevenue || 0).toLocaleString()}`} icon={CreditCard} color="text-green-400" bg="bg-green-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Revenue & Sessions (Last 6 Months)</h2>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)", color: "white", borderRadius: 12 }} itemStyle={{ color: "white" }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (₦)" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(var(--accent))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSess)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Role breakdown pie */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">User Roles</h2>
          {roleBreakdown.length > 0 ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleBreakdown} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                      {roleBreakdown.map((entry: any) => (
                        <Cell key={entry.role} fill={ROLE_COLORS[entry.role] ?? "#888"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)", color: "white", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {roleBreakdown.map((entry: any) => (
                  <div key={entry.role} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: ROLE_COLORS[entry.role] ?? "#888" }} />
                      <span className="text-white/80 capitalize">{entry.role}</span>
                    </div>
                    <span className="text-white font-bold">{entry.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent users */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-5">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left pb-3 text-muted-foreground font-medium">Name</th>
                <th className="text-left pb-3 text-muted-foreground font-medium">Role</th>
                <th className="text-left pb-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left pb-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentUsers.slice(0, 10).map((user: any) => (
                <tr key={user.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${
                      user.role === "tutor" ? "bg-primary/20 text-primary" :
                      user.role === "investor" ? "bg-yellow-500/20 text-yellow-400" :
                      user.role === "admin" ? "bg-red-500/20 text-red-400" :
                      "bg-accent/20 text-accent"
                    }`}>{user.role}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{user.email}</td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${user.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group cursor-default">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${bg} blur-2xl group-hover:scale-150 transition-transform duration-500`} />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-display font-bold text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
