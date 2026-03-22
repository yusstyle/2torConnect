import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, University, ArrowRight, Loader2 } from "lucide-react";
import { useRegisterStudent } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function RegisterStudentPage() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", university: "", admissionType: "", jambScore: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const registerMutation = useRegisterStudent({
    mutation: {
      onSuccess: (res) => {
        setAuthData(res.user, res.token);
        toast({ title: "Account created!", description: "Welcome to 2torConnect." });
        setLocation("/student/dashboard");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Registration Failed", description: err.message || "Please check your details and try again." });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    registerMutation.mutate({
      data: {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone || undefined, university: form.university || undefined,
        admissionType: form.admissionType || undefined,
        jambScore: form.jambScore ? Number(form.jambScore) : undefined,
      },
    });
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <Link href="/register" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </Link>

        <div className="glass-panel p-8 rounded-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Create Student Account</h1>
            <p className="text-muted-foreground">Join thousands of students getting better grades</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input type="text" required value={form.name} onChange={set("name")} className={inputClass} placeholder="Yusuf Hussaini" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={form.phone} onChange={set("phone")} className={inputClass} placeholder="+234 800 000 0000" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <input type="email" required value={form.email} onChange={set("email")} className={inputClass} placeholder="you@university.edu" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">University</label>
              <div className="relative">
                <University className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <input type="text" value={form.university} onChange={set("university")} className={inputClass} placeholder="University of Lagos" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Admission Type</label>
                <select value={form.admissionType} onChange={set("admissionType")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-all">
                  <option value="">Select type</option>
                  <option value="UTME">UTME</option>
                  <option value="Direct Entry">Direct Entry</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">JAMB Score</label>
                <input type="number" value={form.jambScore} onChange={set("jambScore")} min={0} max={400}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                  placeholder="e.g. 280" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input type="password" required value={form.password} onChange={set("password")} className={inputClass} placeholder="Min 6 characters" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input type="password" required value={form.confirmPassword} onChange={set("confirmPassword")} className={inputClass} placeholder="Repeat password" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
            >
              {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Student Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-semibold">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
