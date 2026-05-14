import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Mail, Lock, User, Phone, Building2, Globe, ArrowRight,
  Loader2, Upload, FileCheck, X, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Senegal", "Côte d'Ivoire", "Cameroon", "Zimbabwe",
  "United Kingdom", "United States", "Canada", "Germany", "France", "Netherlands",
  "Switzerland", "Sweden", "Norway", "Denmark", "Spain", "Italy", "Portugal",
  "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain",
  "China", "India", "Singapore", "Japan", "South Korea", "Indonesia", "Malaysia",
  "Australia", "New Zealand",
  "Brazil", "Argentina", "Mexico", "Colombia",
  "Other",
].sort();

const steps = ["Personal Info", "Business Details", "Verification"];

export default function RegisterInvestorPage() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", businessName: "", country: "", bio: "", websiteUrl: "",
  });
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "ID card must be under 10MB" }); return;
    }
    setIdCardFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setIdCardPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else setIdCardPreview(null);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) { toast({ variant: "destructive", title: "Enter your full name" }); return false; }
      if (!form.email.trim()) { toast({ variant: "destructive", title: "Enter your email" }); return false; }
      if (form.password.length < 6) { toast({ variant: "destructive", title: "Password must be at least 6 characters" }); return false; }
      if (form.password !== form.confirmPassword) { toast({ variant: "destructive", title: "Passwords do not match" }); return false; }
    }
    if (step === 1) {
      if (!form.businessName.trim()) { toast({ variant: "destructive", title: "Enter your business/organisation name" }); return false; }
      if (!form.country) { toast({ variant: "destructive", title: "Select your country" }); return false; }
    }
    if (step === 2) {
      if (!idCardFile) { toast({ variant: "destructive", title: "Upload your government ID card" }); return false; }
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (idCardFile) formData.append("idCard", idCardFile);

      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${BASE}/api/auth/register/investor`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setAuthData(data.user, data.token);
      toast({ title: "Account created!", description: "Your investor account is under review." });
      setLocation("/investor/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const ic = "w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all";
  const icIcon = "w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-yellow-500/10 via-background to-background" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <Link href="/register" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors text-sm">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </Link>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-yellow-500/20">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Join as a Sponsor</h1>
                <p className="text-muted-foreground text-sm">Invest in universities and empower top performers</p>
              </div>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mt-4">
              {steps.map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    i < step ? "bg-green-500 text-white" :
                    i === step ? "bg-gradient-to-tr from-yellow-500 to-orange-400 text-white" :
                    "bg-white/10 text-muted-foreground"
                  }`}>{i < step ? "✓" : i + 1}</div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-white" : "text-muted-foreground"}`}>{label}</span>
                  {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? "bg-green-500/50" : "bg-white/10"}`} />}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Full Name *</label>
                    <div className="relative"><User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="text" value={form.name} onChange={set("name")} className={icIcon} placeholder="John Smith" /></div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Phone Number</label>
                    <div className="relative"><Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="tel" value={form.phone} onChange={set("phone")} className={icIcon} placeholder="+234 800 000 0000" /></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Email Address *</label>
                  <div className="relative"><Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={form.email} onChange={set("email")} className={icIcon} placeholder="you@company.com" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Password *</label>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="password" value={form.password} onChange={set("password")} className={icIcon} placeholder="Min. 6 characters" /></div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Confirm Password *</label>
                    <div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} className={icIcon} placeholder="Repeat password" /></div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Business / Organisation Name *</label>
                  <div className="relative"><Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={form.businessName} onChange={set("businessName")} className={icIcon} placeholder="Acme Ventures Ltd." /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Country *</label>
                    <select value={form.country} onChange={set("country")} className={ic}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Website (Optional)</label>
                    <div className="relative"><Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="url" value={form.websiteUrl} onChange={set("websiteUrl")} className={icIcon} placeholder="https://yourcompany.com" /></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">About Your Organisation</label>
                  <textarea value={form.bio} onChange={set("bio")} rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400 transition-all resize-none text-sm"
                    placeholder="Tell us about your investment focus and how you plan to support students and tutors..." />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-300">Upload a valid government-issued ID (National ID, Passport, or Driver's Licence). This is required for verification.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Government ID Card * <span className="text-muted-foreground font-normal">(JPG, PNG or PDF, max 10MB)</span></label>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
                  {!idCardFile ? (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-yellow-400/10 flex items-center justify-center transition-all">
                        <Upload className="w-7 h-7 text-muted-foreground group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold mb-1">Upload Government ID</p>
                        <p className="text-muted-foreground text-sm">Passport, National ID, or Driver's Licence</p>
                      </div>
                    </button>
                  ) : (
                    <div className="border border-green-500/30 bg-green-500/5 rounded-2xl p-4 flex items-center gap-4">
                      {idCardPreview
                        ? <img src={idCardPreview} alt="ID" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                        : <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center"><FileCheck className="w-8 h-8 text-green-400" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{idCardFile.name}</p>
                        <p className="text-muted-foreground text-xs">{(idCardFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <div className="flex items-center gap-1 mt-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-green-400 text-xs font-medium">Ready</span></div>
                      </div>
                      <button type="button" onClick={() => { setIdCardFile(null); setIdCardPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-sm">
                  <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Summary</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-white font-medium">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Business</span><span className="text-white font-medium">{form.businessName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="text-white font-medium">{form.country}</span></div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button type="button" onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 transition-all shadow-lg">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileCheck className="w-5 h-5" /> Submit Application</>}
                </button>
              )}
            </div>
          </form>

          <p className="mt-5 text-center text-muted-foreground text-sm">
            Already have an account? <Link href="/login" className="text-yellow-400 hover:underline font-semibold">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
