import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function parseResponse(res: Response) {
  const raw = await res.text();
  try { return raw ? JSON.parse(raw) : {}; } catch { return { error: raw || `Server error (${res.status})` }; }
}

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }),
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not request a reset code.");
      setCodeSent(true);
      toast({ title: "Check your email", description: data.message });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not send code", description: err.message });
    } finally { setLoading(false); }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not reset password.");
      toast({ title: "Password reset", description: "Your password has been updated. Sign in with your new password." });
      setLocation("/login");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Password reset failed", description: err.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="w-full max-w-md relative z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors text-sm">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Sign In
        </Link>
        <div className="glass-panel p-6 sm:p-10 rounded-3xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              {codeSent ? <KeyRound className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">Reset Your Password</h1>
            <p className="text-muted-foreground text-sm">{codeSent ? `Enter the code sent to ${email} and choose a new password.` : "We’ll email you a one-time code to verify your account."}</p>
          </div>

          {!codeSent ? (
            <form onSubmit={requestCode} className="space-y-5">
              <label className="text-sm font-medium text-white/80 block">Email Address</label>
              <div className="relative -mt-3">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent" placeholder="you@example.com" />
              </div>
              <button disabled={loading} className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />} Send Reset Code
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/80">6-digit email code</label>
                <input type="text" inputMode="numeric" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-accent" placeholder="000000" />
                <p className="text-xs text-muted-foreground mt-1">The code expires in 10 minutes.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">New password</label>
                <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent" placeholder="At least 8 characters, uppercase and a number" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Confirm new password</label>
                <input type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent" placeholder="Enter the new password again" />
              </div>
              <button disabled={loading || code.length !== 6} className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />} Reset Password
              </button>
              <button type="button" onClick={() => { setCodeSent(false); setCode(""); }} className="w-full text-sm text-muted-foreground hover:text-white">Use a different email</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
