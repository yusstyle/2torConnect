import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, Phone, ArrowRight, Loader2, BookOpen,
  Plus, X, GraduationCap, Upload, FileCheck, AlertCircle,
  ChevronRight, ChevronLeft, Video, Globe
} from "lucide-react";
import { UniversityCombobox } from "@/components/UniversityCombobox";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/lib/currency";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Economics", "Accounting", "Government", "Literature", "Geography",
  "Computer Science", "Engineering Mathematics", "Statistics", "Further Mathematics",
  "Organic Chemistry", "Inorganic Chemistry", "Calculus", "Mechanics",
];


const steps = ["Personal Info", "Academic Details", "Documents"];

export default function RegisterTutorPage() {
  const [, setLocation] = useLocation();
  const { login: setAuthData } = useAuthStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", country: "Nigeria", university: "", faculty: "", department: "",
    level: "", aboutYou: "", cgpa: "",
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [schoolIdFile, setSchoolIdFile] = useState<File | null>(null);
  const [schoolIdPreview, setSchoolIdPreview] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const addSubject = (s: string) => {
    const t = s.trim();
    if (t && !subjects.includes(t)) setSubjects(p => [...p, t]);
    setSubjectInput("");
  };
  const removeSubject = (s: string) => setSubjects(p => p.filter(x => x !== s));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "School ID must be under 10MB" });
      return;
    }
    setSchoolIdFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setSchoolIdPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSchoolIdPreview(null);
    }
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) { toast({ variant: "destructive", title: "Enter your full name" }); return false; }
      if (!form.email.trim()) { toast({ variant: "destructive", title: "Enter your email" }); return false; }
      if (form.password.length < 6) { toast({ variant: "destructive", title: "Password must be at least 6 characters" }); return false; }
      if (form.password !== form.confirmPassword) { toast({ variant: "destructive", title: "Passwords do not match" }); return false; }
    }
    if (step === 1) {
      if (!form.university.trim()) { toast({ variant: "destructive", title: "Enter your university" }); return false; }
      if (!form.department.trim()) { toast({ variant: "destructive", title: "Enter your department" }); return false; }
      if (!form.level) { toast({ variant: "destructive", title: "Select your level" }); return false; }
      if (subjects.length === 0) { toast({ variant: "destructive", title: "Add at least one subject you can teach" }); return false; }
    }
    if (step === 2) {
      if (!schoolIdFile) { toast({ variant: "destructive", title: "Upload your school ID card" }); return false; }
      if (!form.cgpa.trim()) { toast({ variant: "destructive", title: "Enter your CGPA" }); return false; }
      const cgpaNum = Number(form.cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 5) {
        toast({ variant: "destructive", title: "CGPA must be between 0 and 5" }); return false;
      }
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
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      formData.append("phone", form.phone);
      if (form.country) formData.append("country", form.country);
      formData.append("university", form.university);
      formData.append("faculty", form.faculty);
      formData.append("department", form.department);
      formData.append("level", form.level);
      formData.append("aboutYou", form.aboutYou);
      formData.append("cgpa", form.cgpa);
      formData.append("subjects", JSON.stringify(subjects));
      if (schoolIdFile) formData.append("schoolIdCard", schoolIdFile);

      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${BASE}/api/auth/register/tutor`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setAuthData(data.user, data.token);
      toast({ title: "Application submitted!", description: "Your application is under review. We'll notify you soon." });
      setLocation("/tutor/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
  const iconInputClass = "w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Link href="/register" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition-colors text-sm">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </Link>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Apply as a Tutor</h1>
                <p className="text-muted-foreground text-sm">Reviewed & approved by our team</p>
              </div>
            </div>

            {/* Progress stepper */}
            <div className="flex items-center gap-2 mt-5">
              {steps.map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    i < step ? "bg-green-500 text-white" :
                    i === step ? "bg-gradient-to-tr from-primary to-accent text-white shadow-md shadow-primary/30" :
                    "bg-white/10 text-muted-foreground"
                  }`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-white" : "text-muted-foreground"}`}>{label}</span>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < step ? "bg-green-500/50" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 0 — Personal Info */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={form.name} onChange={set("name")} className={iconInputClass} placeholder="Yusuf Hussaini" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input type="tel" value={form.phone} onChange={set("phone")} className={iconInputClass} placeholder="+234 800 000 0000" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input type="email" value={form.email} onChange={set("email")} className={iconInputClass} placeholder="you@university.edu.ng" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select value={form.country} onChange={set("country")}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-all appearance-none">
                        <option value="">Select country…</option>
                        {COUNTRIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input type="password" value={form.password} onChange={set("password")} className={iconInputClass} placeholder="Min. 6 characters" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} className={iconInputClass} placeholder="Repeat password" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1 — Academic Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">University *</label>
                      <UniversityCombobox
                        value={form.university}
                        onChange={val => setForm(f => ({ ...f, university: val }))}
                        required
                        placeholder="Search or type your university…"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Level *</label>
                      <select value={form.level} onChange={set("level")} className={inputClass}>
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
                      <input type="text" value={form.faculty} onChange={set("faculty")} className={inputClass} placeholder="Engineering" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Department *</label>
                      <input type="text" value={form.department} onChange={set("department")} className={inputClass} placeholder="Computer Science" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Subjects You Can Teach *</label>
                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {subjects.map(s => (
                          <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                            {s}
                            <button type="button" onClick={() => removeSubject(s)} className="hover:text-white transition-colors ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text" value={subjectInput}
                          onChange={e => setSubjectInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubject(subjectInput); } }}
                          list="subjects-list"
                          className={iconInputClass}
                          placeholder="Type a subject and press Enter"
                        />
                        <datalist id="subjects-list">
                          {SUBJECTS.filter(s => !subjects.includes(s)).map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                      <button type="button" onClick={() => addSubject(subjectInput)}
                        className="px-4 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">About You</label>
                    <textarea
                      value={form.aboutYou} onChange={set("aboutYou")} rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-all resize-none text-sm"
                      placeholder="Tell students about your achievements, teaching style, and what makes you great..." />
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Documents */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">
                      Your school ID card and CGPA are required for verification. Our team reviews all applications within 24–48 hours.
                    </p>
                  </div>

                  {/* School ID Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">School ID Card * <span className="text-muted-foreground font-normal">(JPG, PNG or PDF, max 10MB)</span></label>
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />

                    {!schoolIdFile ? (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-all">
                          <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-semibold mb-1">Upload School ID Card</p>
                          <p className="text-muted-foreground text-sm">Click to browse or drag your file here</p>
                        </div>
                      </button>
                    ) : (
                      <div className="border border-green-500/30 bg-green-500/5 rounded-2xl p-4 flex items-center gap-4">
                        {schoolIdPreview ? (
                          <img src={schoolIdPreview} alt="ID preview" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
                            <FileCheck className="w-8 h-8 text-green-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{schoolIdFile.name}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{(schoolIdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-green-400 text-xs font-medium">Ready to upload</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSchoolIdFile(null); setSchoolIdPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                          className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CGPA */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-white/80">Current CGPA * <span className="text-muted-foreground font-normal">(Out of 5.0)</span></label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number" min="0" max="5" step="0.01"
                        value={form.cgpa} onChange={set("cgpa")}
                        className={iconInputClass}
                        placeholder="e.g. 4.25"
                      />
                    </div>
                    {form.cgpa && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${Math.min((Number(form.cgpa) / 5) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${Number(form.cgpa) >= 3.5 ? "text-green-400" : Number(form.cgpa) >= 2.5 ? "text-yellow-400" : "text-red-400"}`}>
                          {Number(form.cgpa) >= 4.5 ? "First Class" : Number(form.cgpa) >= 3.5 ? "Second Class Upper" : Number(form.cgpa) >= 2.5 ? "Second Class Lower" : "Pass"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary card */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-sm">
                    <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Application Summary</p>
                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-white font-medium">{form.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">University</span><span className="text-white font-medium">{form.university}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span className="text-white font-medium">{form.level} Level</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subjects</span><span className="text-white font-medium">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={prevStep}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              {step < steps.length - 1 ? (
                <button type="button" onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileCheck className="w-5 h-5" /> Submit Application</>}
                </button>
              )}
            </div>
          </form>

          <p className="mt-5 text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-semibold">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
