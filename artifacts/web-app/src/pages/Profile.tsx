import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Loader2, Check, User, Mail, Phone, ShieldCheck,
  Building2, Hash, CreditCard, AtSign, Eye, EyeOff, ChevronRight,
  Headphones, Settings, LogOut, BookOpen, Gift, Globe, FileText,
  Sparkles, X, Receipt, Clock
} from "lucide-react";
import { useListTransactions } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "First City Monument Bank", "Globus Bank", "GT Bank", "Heritage Bank",
  "Keystone Bank", "Parallex Bank", "Polaris Bank", "Providus Bank",
  "Stanbic IBTC Bank", "Standard Chartered", "Sterling Bank", "SunTrust Bank",
  "Union Bank", "United Bank for Africa", "Unity Bank", "Wema Bank", "Zenith Bank",
  "Kuda Bank", "Opay", "PalmPay", "Moniepoint",
];

export default function ProfilePage() {
  const { user, token, login, logout } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(user?.avatarUrl ?? null);

  const [showBalance, setShowBalance] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Edit info state
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [username, setUsername] = useState((user as any)?.username ?? "");
  const [savingUsername, setSavingUsername] = useState(false);

  // Bank info state
  const [savingBank, setSavingBank] = useState(false);
  const [bankName, setBankName] = useState((user as any)?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState((user as any)?.bankAccountNumber ?? "");
  const [bankAccountName, setBankAccountName] = useState((user as any)?.bankAccountName ?? "");

  const { data: txData } = useListTransactions({ userId: user?.id, limit: 100 });

  if (!user) return null;

  const transactions = txData?.transactions ?? [];
  const completedTx = transactions.filter((t) => t.status === "completed");
  const totalFunded = completedTx.filter((t) => t.type === "bonus").reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = completedTx.filter((t) => t.type === "payment").reduce((s, t) => s + Number(t.amount), 0);
  const balance = Math.max(0, totalFunded - totalSpent);

  const showBankSection = (user.role as string) === "student" || (user.role as string) === "tutor";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch(`${BASE}/api/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      login({ ...user, avatarUrl: data.avatarUrl }, token!);
      toast({ title: "Profile photo updated!" });
    } catch {
      toast({ variant: "destructive", title: "Failed to upload photo" });
      setPreview(user.avatarUrl ?? null);
    } finally { setUploading(false); }
  };

  const handleSaveUsername = async () => {
    setSavingUsername(true);
    try {
      const res = await fetch(`${BASE}/api/users/${user.id}/username`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      login({ ...user, username: data.username } as any, token!);
      setUsername(data.username ?? "");
      toast({ title: `Username set to @${data.username}!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to set username", description: e.message });
    } finally { setSavingUsername(false); }
  };

  const handleSave = async () => {
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const digitCount = (trimmedPhone.match(/\d/g) || []).length;
      if (!/^[\d\s+\-()]+$/.test(trimmedPhone) || digitCount < 7) {
        toast({ variant: "destructive", title: "Invalid phone number", description: "Use digits only (spaces, +, - and () are fine)." });
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/users/${user.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      login({ ...user, name: updated.name, phone: updated.phone }, token!);
      toast({ title: "Profile updated successfully!" });
      setShowEditModal(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to save profile" });
    } finally { setSaving(false); }
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      const res = await fetch(`${BASE}/api/users/${user.id}/bank-details`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, bankAccountNumber, bankAccountName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }
      const data = await res.json();
      login({ ...user, bankName: data.bankName, bankAccountNumber: data.bankAccountNumber, bankAccountName: data.bankAccountName } as any, token!);
      toast({ title: "Bank details saved!", description: "Your payout account has been updated." });
      setShowBankModal(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to save bank details", description: e.message });
    } finally { setSavingBank(false); }
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <DashboardLayout role={user.role as any}>
      <div className="max-w-xl mx-auto space-y-4">

        {/* ── 1. Top User Profile Card (OPay 'Me' Header + Mockup Mode Indicator) ── */}
        <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar with camera badge */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-card overflow-hidden flex items-center justify-center font-bold text-white text-lg">
                    {preview ? (
                      <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-card flex items-center justify-center shadow transition-colors"
                  title="Change Photo"
                >
                  {uploading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-black" />
                  ) : (
                    <Camera className="w-3 h-3 text-black" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>

              {/* User Name & Tier Badge */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                    {user.name}
                  </h1>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                {(user as any)?.username && (
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">
                    @{(user as any).username}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                    Tier 3 · {user.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {(user as any)?.university || "Verified Scholar"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Headset & Settings */}
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href="/messages"
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Help & Support"
              >
                <Headphones className="w-4 h-4 text-emerald-400" />
              </Link>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Account Settings"
              >
                <Settings className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Mode Indicator Pill (Student Mode vs Tutor Mode from Mockup) */}
          <div className="p-2 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-bold">
            <span className={`flex-1 text-center py-1.5 rounded-xl transition-all ${
              user.role === "student" ? "bg-emerald-500 text-black font-extrabold shadow-sm" : "text-muted-foreground"
            }`}>
              Student Mode
            </span>
            <span className={`flex-1 text-center py-1.5 rounded-xl transition-all ${
              user.role === "tutor" ? "bg-emerald-500 text-black font-extrabold shadow-sm" : "text-muted-foreground"
            }`}>
              Tutor Mode
            </span>
          </div>
        </div>

        {/* ── 2. Total Balance Card (OPay 'Me' Total Balance) ── */}
        <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Total Balance</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-0.5 hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div
              onClick={() => setLocation(user.role === "tutor" ? "/tutor/earnings" : "/student/wallet")}
              className="cursor-pointer group flex items-center gap-1.5"
            >
              <p className="text-2xl font-black text-white tracking-tight">
                {showBalance ? `₦${balance.toLocaleString()}` : "****"}
              </p>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total Spent {showBalance ? `₦${totalSpent.toLocaleString()}` : "****"}
            </p>
          </div>

          <button
            onClick={() => setLocation(user.role === "tutor" ? "/tutor/earnings" : "/student/wallet")}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow transition-all active:scale-95"
          >
            {user.role === "tutor" ? "Withdraw" : "Fund Wallet"}
          </button>
        </div>

        {/* ── 3. Quick Action Squircle Buttons (OPay 3-Action Row) ── */}
        <div className="glass-panel rounded-3xl p-4 border border-white/10 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <button
              onClick={() => setLocation(user.role === "tutor" ? "/tutor/earnings" : "/student/wallet")}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90">Transactions</span>
            </button>

            <button
              onClick={() => setShowBankModal(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90">Bank Details</span>
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/5 active:scale-95 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white/90">Security</span>
            </button>
          </div>
        </div>

        {/* ── 4. Grouped Menu List (OPay 'Me' + Mockup 'More' list structure) ── */}
        <div className="glass-panel rounded-3xl p-2 border border-white/10 shadow-sm divide-y divide-white/5">
          {/* User Verification (Mockup) */}
          <div className="w-full flex items-center justify-between p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">User Verification</span>
                <p className="text-[11px] text-muted-foreground">Campus identity & phone confirmed</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
              Verified
            </span>
          </div>

          {/* Sessions & Bookings */}
          <button
            onClick={() => setLocation(user.role === "tutor" ? "/tutor/sessions" : "/student/sessions")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">
                {user.role === "tutor" ? "My Tutoring Sessions" : "My Bookings & Sessions"}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* If Tutor: Availability & Schedule (Mockup) */}
          {user.role === "tutor" && (
            <button
              onClick={() => setLocation("/tutor/availability")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Weekly Availability & Schedule</span>
                  <p className="text-[11px] text-muted-foreground">Manage your tutoring hours & days</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Bank Account Details */}
          {showBankSection && (
            <button
              onClick={() => setShowBankModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Bank Card / Payout Account</span>
                  {bankAccountNumber && (
                    <p className="text-[11px] text-muted-foreground">{bankName} · ****{bankAccountNumber.slice(-4)}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Invite & Collect (Mockup) */}
          <button
            onClick={() => setLocation("/referral")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">Invite Friends & Earn ₦500</span>
                <p className="text-[11px] text-muted-foreground">Get instant cash bonus for every scholar you bring</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-[11px] transition-colors">
              Invite
            </span>
          </button>

          {/* Course Study Materials */}
          <button
            onClick={() => setLocation(user.role === "tutor" ? "/tutor/materials" : "/student/materials")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">Course Study Materials</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* ConnectFeed */}
          <button
            onClick={() => setLocation("/socialise")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">ConnectFeed Campus Community</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Help & Contact Support (Mockup) */}
          <button
            onClick={() => setLocation("/messages")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">Contact Support & FAQ</span>
                <p className="text-[11px] text-muted-foreground">Reach our 24/7 student success team</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Edit Profile & Details */}
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">Personal Profile & Contact Info</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── 5. Smart Assistant Banner (OPay Smart Assistant) ── */}
        <div
          onClick={() => setLocation("/student/ai-assistant")}
          className="rounded-3xl p-4 bg-gradient-to-r from-cyan-950/40 via-card to-emerald-950/40 border border-cyan-500/30 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">2torAssist: Homework & Exam Solver</p>
              <p className="text-xs text-muted-foreground">Ask step-by-step questions or snap problems</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* ── 6. Log Out Button ── */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>

      </div>

      {/* ── Modal: Edit Profile & Username ── */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Personal Profile</h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email (Cannot be changed)</label>
                <input
                  value={user.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Phone Number</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">ConnectFeed Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">@</span>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30))}
                    placeholder="yourhandle"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (username.trim() && username !== (user as any)?.username) {
                      await handleSaveUsername();
                    }
                    await handleSave();
                  }}
                  disabled={saving || savingUsername}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {(saving || savingUsername) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Bank Account Details ── */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Payout Bank Account</h3>
                <button onClick={() => setShowBankModal(false)} className="p-1 text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Bank Name</label>
                <select
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Select your bank…</option>
                  {NIGERIAN_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">10-Digit Account Number</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="0123456789"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Account Name (Full Name on Bank)</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={e => setBankAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  disabled={savingBank || !bankName || !bankAccountNumber || !bankAccountName}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
