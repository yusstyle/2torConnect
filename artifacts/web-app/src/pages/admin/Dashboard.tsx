import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetAdminStats } from "@workspace/api-client-react";
import {
  Users, GraduationCap, BookOpen, CreditCard, TrendingUp,
  Shield, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, Lock, Eye, Terminal, Clock, Globe
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuthStore } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";
import { format } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  student: "hsl(var(--accent))",
  tutor: "hsl(var(--primary))",
  admin: "#ef4444",
  investor: "#f59e0b",
};

interface SecurityLog {
  id: number;
  eventType: string;
  severity: "info" | "warning" | "critical";
  ipAddress: string;
  userAgent: string;
  email: string | null;
  details: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();
  const { token } = useAuthStore();

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<string>("all");

  const chartData = (stats as any)?.chartData ?? [];
  const recentUsers = (stats as any)?.recentUsers ?? [];
  const roleBreakdown = (stats as any)?.roleBreakdown ?? [];

  const fetchSecurityLogs = useCallback(async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/security-logs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityLogs(data.logs || []);
      }
    } catch (e) {
      console.warn("Could not load security logs", e);
    } finally {
      setLogsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSecurityLogs();
  }, [fetchSecurityLogs]);

  const filteredLogs = securityLogs.filter((log) => {
    if (logFilter === "all") return true;
    if (logFilter === "probes") return log.eventType === "unauthorized_probe";
    if (logFilter === "lockouts") return log.eventType === "account_locked";
    if (logFilter === "failed") return log.eventType === "failed_login";
    if (logFilter === "success") return log.eventType === "successful_login";
    return true;
  });

  const criticalCount = securityLogs.filter((l) => l.severity === "critical").length;
  const warningCount = securityLogs.filter((l) => l.severity === "warning").length;

  if (isLoading) {
    return (
      <DashboardLayout role="admin" title="Admin Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Platform Overview">
      <div className="mb-6">
        <p className="text-muted-foreground">Monitor platform growth, live operations, and enterprise security defense.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard title="Active Tutors" value={stats?.totalTutors || 0} icon={GraduationCap} color="text-primary" bg="bg-primary/20" />
        <StatCard title="Total Sessions" value={stats?.totalSessions || 0} icon={BookOpen} color="text-accent" bg="bg-accent/20" />
        <StatCard title="Revenue" value={`₦${Number(stats?.totalRevenue || 0).toLocaleString()}`} icon={CreditCard} color="text-green-400" bg="bg-green-500/10" />
      </div>

      {/* Security Health & Intrusion Detection Banner */}
      <div className="glass-panel rounded-2xl p-6 mb-8 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-background to-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Intrusion Shield & Threat Monitor</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Defense
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Universal HMAC-SHA256 Token Vault • Sliding-Window Rate Limiter • 5-Attempt Account Lockout • Audit Trail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Probes & Alerts</p>
              <p className="text-sm font-semibold text-white">
                <span className="text-rose-400">{criticalCount} critical</span> · <span className="text-amber-400">{warningCount} warnings</span>
              </p>
            </div>
            <button
              onClick={fetchSecurityLogs}
              disabled={logsLoading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all border border-white/10 disabled:opacity-50"
              title="Refresh Security Logs"
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Security defense cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-b border-white/10">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <p className="text-[11px] text-muted-foreground">Cryptographic Secret</p>
            <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> 512-Bit HMAC Vault
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <p className="text-[11px] text-muted-foreground">Anti-Brute Force</p>
            <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> 5 Max Attempts / 15m
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <p className="text-[11px] text-muted-foreground">Traffic Defense</p>
            <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Sliding Rate Limit (150/m)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <p className="text-[11px] text-muted-foreground">Protected Endpoints</p>
            <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> All /api/* Guarded
            </p>
          </div>
        </div>

        {/* Filter chips & table header */}
        <div className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "all", label: `All Events (${securityLogs.length})` },
                { id: "probes", label: "Blocked Probes" },
                { id: "lockouts", label: "Account Lockouts" },
                { id: "failed", label: "Failed Logins" },
                { id: "success", label: "Logins" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLogFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    logFilter === f.id
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">Showing {filteredLogs.length} recent events</span>
          </div>

          <div className="overflow-x-auto max-h-[320px] rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur z-10 border-b border-white/10">
                <tr>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Timestamp</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Severity</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Event</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Origin IP</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Account / Target</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                      {log.createdAt ? format(new Date(log.createdAt), "MMM d, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.severity === "critical"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : log.severity === "warning"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {log.severity === "critical" && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium whitespace-nowrap">
                      {log.eventType === "unauthorized_probe"
                        ? "🛡️ Blocked Probe"
                        : log.eventType === "account_locked"
                        ? "🔒 Frozen (Lockout)"
                        : log.eventType === "failed_login"
                        ? "⚠️ Failed Login"
                        : log.eventType === "successful_login"
                        ? "✅ Auth Success"
                        : log.eventType}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300 font-mono whitespace-nowrap">{log.ipAddress || "—"}</td>
                    <td className="py-2.5 px-3 text-white/80 font-sans whitespace-nowrap truncate max-w-[150px]">{log.email || "Anonymous"}</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-sans truncate max-w-[320px]" title={log.details || ""}>
                      {log.details || "—"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground font-sans">
                      {logsLoading ? "Loading security events..." : "No intrusion events recorded. All perimeter shields active and green."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "white",
                      borderRadius: 12,
                    }}
                    itemStyle={{ color: "white" }}
                  />
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
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${
                        user.role === "tutor"
                          ? "bg-primary/20 text-primary"
                          : user.role === "investor"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : user.role === "admin"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-accent/20 text-accent"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{user.email}</td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${
                        user.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No users yet
                  </td>
                </tr>
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
