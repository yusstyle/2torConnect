import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useLogin, LoginRequestRole } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthStore();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<LoginRequestRole>("student");

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (res) => {
        setAuthData(res.user, res.token);
        toast({ title: "Welcome back!", description: `Logged in as ${res.user.name}` });
        setLocation(`/${res.user.role}/dashboard`);
      },
      onError: (err: any) => {
        const serverMsg =
          err?.data?.error ||
          err?.data?.message ||
          "Invalid credentials. Please check your email, password, and selected role.";
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: serverMsg
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password, role } });
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
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your 2torConnect account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">Sign in as</p>
                <div className="grid grid-cols-3 gap-3 p-1 rounded-xl bg-black/40 border border-white/10">
                  {(["student", "tutor", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold capitalize transition-all ${
                        role === r 
                          ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg" 
                          : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-accent hover:underline font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
