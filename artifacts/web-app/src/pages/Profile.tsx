import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Camera, Loader2, Check, User, Mail, Phone, ShieldCheck, Building2, Hash, CreditCard } from "lucide-react";

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
  const { user, token, login } = useAuthStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [savingBank, setSavingBank] = useState(false);
  const [bankName, setBankName] = useState((user as any)?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState((user as any)?.bankAccountNumber ?? "");
  const [bankAccountName, setBankAccountName] = useState((user as any)?.bankAccountName ?? "");

  if (!user) return null;

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

  const handleSave = async () => {
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
      toast({ title: "Profile saved!" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save" });
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
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to save bank details", description: e.message });
    } finally { setSavingBank(false); }
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const ROLE_GRADIENT: Record<string, string> = {
    student: "from-accent to-primary",
    tutor: "from-primary to-purple-600",
    investor: "from-yellow-500 to-orange-400",
    admin: "from-red-500 to-pink-500",
  };

  return (
    <DashboardLayout role={user.role as any} title="My Profile">
      <div className="max-w-xl space-y-6">

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className={`w-28 h-28 rounded-full bg-gradient-to-tr ${ROLE_GRADIENT[user.role] ?? "from-primary to-accent"} flex items-center justify-center text-white text-4xl font-bold shadow-2xl overflow-hidden`}>
              {preview
                ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                : <span>{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:bg-accent transition-all shadow-lg"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">{user.name}</p>
            <p className={`text-sm font-semibold capitalize mt-1 ${user.role === "investor" ? "text-yellow-400" : user.role === "admin" ? "text-red-400" : "text-accent"}`}>{user.role}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full mt-2 font-medium ${user.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              <ShieldCheck className="w-3 h-3" /> {user.status}
            </span>
          </div>
          <p className="text-muted-foreground text-xs text-center">Tap the camera icon to change your profile photo</p>
        </motion.div>

        {/* Edit info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-3xl p-6 space-y-5">
          <h3 className="text-white font-bold text-lg">Account Details</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={user.email} readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground text-sm cursor-not-allowed" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </motion.div>

        {/* Bank account details — students and tutors only */}
        {showBankSection && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Payout Account</h3>
                <p className="text-xs text-muted-foreground">Where your {user.role === "tutor" ? "earnings" : "sponsorship funds"} will be sent</p>
              </div>
            </div>

            {(bankName || bankAccountNumber) && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm">{bankName}</p>
                  <p className="text-muted-foreground text-xs">{bankAccountName} · ****{bankAccountNumber.slice(-4)}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5" /> Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 appearance-none"
                >
                  <option value="" className="bg-gray-900">Select your bank…</option>
                  {NIGERIAN_BANKS.map(b => (
                    <option key={b} value={b} className="bg-gray-900">{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5 font-medium">
                  <Hash className="w-3.5 h-3.5" /> Account Number
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit account number"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5" /> Account Name
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={e => setBankAccountName(e.target.value)}
                  placeholder="Name on the bank account"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBank}
              disabled={savingBank || !bankName || !bankAccountNumber || !bankAccountName}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {savingBank ? "Saving…" : "Save Payout Account"}
            </button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
