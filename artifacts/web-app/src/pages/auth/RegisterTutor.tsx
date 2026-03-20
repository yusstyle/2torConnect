import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, ArrowRight, Loader2, BookOpen, Plus, X } from "lucide-react";
import { useRegisterTutor } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Economics", "Accounting", "Government", "Literature", "Geography",
  "Computer Science", "Engineering Mathematics", "Statistics", "Further Mathematics",
];

export default function RegisterTutorPage() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", university: "", faculty: "", department: "", level: "", aboutYou: "",
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const addSubject = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && !subjects.includes(trimmed)) setSubjects(prev => [...prev, trimmed]);
    setSubjectInput("");
  };

  const removeSubject = (s: string) => setSubjects(prev => prev.filter(x => x !== s));

  const registerMutation = useRegisterTutor({
    mutation: {
      onSuccess: (res) => {
        setAuthData(res.user, res.token);
        toast({ title: "Application submitted!", description: "Your tutor application is under review." });
        setLocation("/tutor/dashboard");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Registration Failed", description: err.message || "Please check your details." });
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
        faculty: form.faculty || undefined, department: form.department || undefined,
        level: form.level || undefined, aboutYou: form.aboutYou || undefined,
        subjects: subjects.length > 0 ? subjects : undefined,
      },
    });
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
  const plainInputClass = "w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Link href="/register" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </Link>

        <div className="glass-panel p-8 rounded-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Apply as a Tutor</h1>
            <p className="text-muted-foreground">Your application will be reviewed before approval</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input type="text" required value={form.name} onChange={set("name")} className={inputClass} placeholder="John Doe" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">University</label>
                <input type="text" value={form.university} onChange={set("university")} className={plainInputClass} placeholder="University of Lagos" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Level</label>
                <select value={form.level} onChange={set("level")} className={plainInputClass}>
                  <option value="">Select level</option>
                  {["100", "200", "300", "400", "500", "Postgraduate"].map(l => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Faculty</label>
                <input type="text" value={form.faculty} onChange={set("faculty")} className={plainInputClass} placeholder="Engineering" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Department</label>
                <input type="text" value={form.department} onChange={set("department")} className={plainInputClass} placeholder="Computer Science" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Subjects You Can Teach</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {subjects.map(s => (
                  <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    {s}
                    <button type="button" onClick={() => removeSubject(s)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BookOpen className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubject(subjectInput); } }}
                    list="subjects-list"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-all"
                    placeholder="Type a subject and press Enter"
                  />
                  <datalist id="subjects-list">
                    {SUBJECTS.filter(s => !subjects.includes(s)).map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <button type="button" onClick={() => addSubject(subjectInput)}
                  className="px-4 py-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">About You</label>
              <textarea
                value={form.aboutYou} onChange={set("aboutYou")} rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-all resize-none"
                placeholder="Tell students about your academic achievements, teaching style, and why you'd make a great tutor..." />
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
              {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Tutor Application"}
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
