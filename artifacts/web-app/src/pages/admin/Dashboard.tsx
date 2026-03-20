import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Users, GraduationCap, BookOpen, CreditCard } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dummy chart data since API doesn't return time-series
const chartData = [
  { name: 'Mon', revenue: 4000, sessions: 24 },
  { name: 'Tue', revenue: 3000, sessions: 13 },
  { name: 'Wed', revenue: 2000, sessions: 98 },
  { name: 'Thu', revenue: 2780, sessions: 39 },
  { name: 'Fri', revenue: 1890, sessions: 48 },
  { name: 'Sat', revenue: 2390, sessions: 38 },
  { name: 'Sun', revenue: 3490, sessions: 43 },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return <DashboardLayout><div className="text-white">Loading stats...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor activity and metrics across 3torConnect.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Active Tutors" value={stats?.totalTutors || 0} icon={GraduationCap} color="text-primary" bg="bg-primary/20" />
        <StatCard title="Total Sessions" value={stats?.totalSessions || 0} icon={BookOpen} color="text-accent" bg="bg-accent/20" />
        <StatCard title="Revenue" value={`₦${stats?.totalRevenue || 0}`} icon={CreditCard} color="text-green-500" bg="bg-green-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Revenue & Activity</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Users</h2>
          <div className="space-y-4">
            {stats?.recentUsers?.slice(0,5).map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
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
