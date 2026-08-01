import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const SUPER_ADMIN_EMAIL = "admin2-yusstyle@gmail.com";

// The API can fail before it ever reaches Express (e.g. the DB connection
// throws at boot on Vercel) and return plain text like
// "Backend failed to start: DATABASE_URL must be set" instead of JSON.
// res.json() throws on that, which used to get swallowed into a generic
// "Could not connect to server" toast. This reads the raw text first so we
// can always show the real reason.
async function parseApiResponse(res: Response): Promise<any> {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { error: raw || `Server returned ${res.status} with no readable body.` };
  }
}

type Step = "credentials" | "otp";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<Step>("credentials");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function getRedirectPath(user: any): string {
    if (user.email === SUPER_ADMIN_EMAIL) return "/superadmin";
    if (user.role === "admin") return "/admin/dashboard";
    return `/${user.role}/dashboard`;
  }

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Login Failed", description: data.error || `Server error (${res.status}). Please try again.` });
        return;
      }
      if (data.user.role === "admin") {
        setAuthData(data.user, data.token);
        toast({ title: "Welcome back!", description: `Signed in as ${data.user.name}` });
        setLocation(getRedirectPath(data.user));
        return;
      }
      const otpRes = await fetch(`${BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const otpData = otpRes.ok ? await parseApiResponse(otpRes) : null;

      if (otpData?.emailConfigured) {
        toast({ title: "OTP Sent", description: "Check your email for a 6-digit verification code." });
        setStep("otp");
        startCooldown();
      } else {
        setAuthData(data.user, data.token);
        toast({ title: "Welcome back!", description: `Signed in as ${data.user.name}` });
        setLocation(getRedirectPath(data.user));
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Login Failed", description: err instanceof Error ? `Network error: ${err.message}` : "Could not reach the server. Check your connection." });
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Invalid Code", description: data.error || `The OTP you entered is wrong or expired. (Server error ${res.status})` });
        return;
      }
      setAuthData(data.user, data.token);
      toast({ title: "Verified!", description: `Welcome back, ${data.user.name}` });
      setLocation(getRedirectPath(data.user));
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed", description: err instanceof Error ? `Network error: ${err.message}` : "Could not reach the server." });
    } finally {
      setOtpLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await fetch(`${BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      toast({ title: "OTP Resent", description: "A new code has been sent to your email." });
      startCooldown();
    } catch {
      toast({ variant: "destructive", title: "Failed to resend" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </Link>

        <div className="glass-panel p-8 sm:p-10 rounded-3xl">
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
                  <p className="text-muted-foreground">Sign in to your 2torConnect account</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="you@university.edu"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-3.5 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing inâ€¦</> : "Sign In"}
                  </button>
                </form>

                <p className="mt-8 text-center text-muted-foreground text-sm">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-accent hover:underline font-semibold">Create one</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-white mb-2">Check Your Email</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to<br />
                    <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white text-center text-3xl font-bold tracking-widest placeholder:text-white/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                      placeholder="000000"
                    />
                    <p className="text-xs text-muted-foreground text-center">Code expires in 10 minutes</p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otp.length < 6}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {otpLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifyingâ€¦</> : <><ShieldCheck className="w-5 h-5" /> Verify & Sign In</>}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    onClick={resendOtp}
                    disabled={resendCooldown > 0}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                  <button
                    onClick={() => { setStep("credentials"); setOtp(""); }}
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                  >
                    â† Use a different email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
