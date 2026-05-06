import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";
import {
  Shield, UserPlus, Trash2, Loader2, RefreshCw,
  Eye, EyeOff, CheckCircle, XCircle, Key, LogOut,
  Users, Mail, Lock, User, BadgeCheck
} from "lucide-react";
import { format } from "date-fns";

const SUPER_ADMIN_EMAIL = "admin2-yusstyle@gmail.com";

interface Admin {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export default function SuperAdminPage() {
  const { user, token, logout } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [resetId, setResetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      setLocation("/login");
      return;
    }
    loadAdmins();
  }, [user]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/superadmin/admins`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAdmins(data.admins);
    } catch {
      toast({ variant: "destructive", title: "Could not load admins" });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${getApiUrl()}/superadmin/admins`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Admin created", description: `${name} can now log in as an admin.` });
      setName(""); setEmail(""); setPassword(""); setShowForm(false);
      loadAdmins();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to create admin", description: e.message });
    } finally {
      setCreating(false);
    }
  };

  const deleteAdmin = async (id: number, adminName: string) => {
    if (!confirm(`Remove admin "${adminName}"? They will lose admin access.`)) return;
    try {
      const res = await fetch(`${getApiUrl()}/superadmin/admins/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Admin removed" });
      loadAdmins();
    } catch {
      toast({ variant: "destructive", title: "Failed to remove admin" });
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`${getApiUrl()}/superadmin/admins/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: `Admin ${newStatus === "active" ? "activated" : "suspended"}` });
      loadAdmins();
    } catch {
      toast({ variant: "destructive", title: "Failed to update admin" });
    }
  };

  const resetPassword = async (id: number) => {
    if (!newPassword.trim()) { toast({ variant: "destructive", title: "Enter a new password" }); return; }
    try {
      const res = await fetch(`${getApiUrl()}/superadmin/admins/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Password updated successfully" });
      setResetId(null); setNewPassword("");
    } catch {
      toast({ variant: "destructive", title: "Failed to update password" });
    }
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  if (!user || user.email !== SUPER_ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Super Admin Control</p>
              <p className="text-xs text-red-400 font-medium">Restricted Access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" />
              {user.email}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Warning banner */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-bold text-sm mb-1">Super Admin Exclusive Area</p>
            <p className="text-muted-foreground text-xs">
              This dashboard is only accessible by <strong className="text-white">{SUPER_ADMIN_EMAIL}</strong>.
              Admins you create here can access <code className="text-accent">/admin/dashboard</code> but NOT this page.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Total Admins", value: admins.length, color: "text-primary" },
            { icon: CheckCircle, label: "Active Admins", value: admins.filter(a => a.status === "active").length, color: "text-green-400" },
            { icon: XCircle, label: "Suspended", value: admins.filter(a => a.status !== "active").length, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="glass-panel rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Manage Admins</h2>
          <div className="flex gap-2">
            <button onClick={loadAdmins} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25"
            >
              <UserPlus className="w-4 h-4" />
              {showForm ? "Cancel" : "Add Admin"}
            </button>
          </div>
        </div>

        {/* Create admin form */}
        {showForm && (
          <form onSubmit={createAdmin} className="glass-panel rounded-2xl p-6 space-y-4 border border-primary/30">
            <h3 className="text-white font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Create New Admin
            </h3>
            <p className="text-muted-foreground text-sm">
              The new admin will receive their login credentials. They can access <code className="text-accent">/admin/dashboard</code> but not this page.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Admin Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-3.5 text-muted-foreground hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-white transition-colors text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Admin
              </button>
            </div>
          </form>
        )}

        {/* Admin list */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-accent" /></div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-white font-bold mb-1">No admins yet</p>
                <p className="text-muted-foreground text-sm">Click "Add Admin" to create your first admin account.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {admins.map(admin => (
                <div key={admin.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold">{admin.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-white font-semibold">{admin.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${admin.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {admin.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {format(new Date(admin.createdAt), "MMM d, yyyy")}
                        {admin.lastLogin && ` · Last login ${format(new Date(admin.lastLogin), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => toggleStatus(admin.id, admin.status)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          admin.status === "active"
                            ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                            : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        }`}
                      >
                        {admin.status === "active" ? <><XCircle className="w-3.5 h-3.5" /> Suspend</> : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>}
                      </button>
                      <button
                        onClick={() => setResetId(resetId === admin.id ? null : admin.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" /> Password
                      </button>
                      <button
                        onClick={() => deleteAdmin(admin.id, admin.name)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Inline password reset */}
                  {resetId === admin.id && (
                    <div className="mt-4 ml-15 flex gap-3 items-center pl-15">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="New password for this admin..."
                          className="w-full bg-white/5 border border-blue-500/30 rounded-xl px-4 py-2.5 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <button
                        onClick={() => resetPassword(admin.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                      >
                        <Key className="w-4 h-4" /> Update
                      </button>
                      <button onClick={() => { setResetId(null); setNewPassword(""); }} className="text-muted-foreground hover:text-white transition-colors text-sm px-2">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note about regular admin dashboard */}
        <div className="glass-panel rounded-2xl p-5 border border-accent/20">
          <h3 className="text-white font-bold mb-2 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" /> Access Control Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-red-400 font-semibold mb-1">Super Admin (you)</p>
              <p>Full access: this page + all admin pages. Can create, suspend, and delete other admins.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-accent font-semibold mb-1">Regular Admins</p>
              <p>Access to <code>/admin/dashboard</code>, user management, and transactions. Cannot access this Super Admin panel.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
