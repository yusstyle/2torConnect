import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import {
  BookOpen, Users, Star, ArrowRight, ShieldCheck, Zap, CheckCircle,
  TrendingUp, Clock, MessageSquare, Award, Target, GraduationCap,
  Banknote, Calendar, ChevronRight, ChevronDown, HandCoins, Video, Globe2, Heart, Smartphone,
  PenTool, Layers, Headphones, Mic, Flame, Sparkles, Search, BadgeCheck
} from "lucide-react";
import InstallAppModal from "@/components/InstallAppModal";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

interface PlatformStats {
  totalStudents: number;
  totalTutors: number;
  universities: number;
  totalRevenue: number;
}

function formatEarnings(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M+`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K+`;
  return `₦${amount}`;
}

function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  return `${n.toLocaleString()}+`;
}

function isPlatformStats(value: unknown): value is PlatformStats {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlatformStats>;
  return (
    typeof candidate.totalStudents === "number" &&
    typeof candidate.totalTutors === "number" &&
    typeof candidate.universities === "number" &&
    typeof candidate.totalRevenue === "number"
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [showInstallApp, setShowInstallApp] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isPlatformStats(data)) setStats(data);
      })
      .catch(() => {});
  }, []);

  const heroStats = [
    {
      value: stats ? formatCount(stats.totalStudents) : "10,000+",
      label: "Students",
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      value: stats ? formatCount(stats.totalTutors) : "1,200+",
      label: "Verified Tutors",
      icon: GraduationCap,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      value: stats ? formatCount(stats.universities) : "45+",
      label: "Campuses",
      icon: Award,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      value: stats ? formatEarnings(stats.totalRevenue) : "₦4.5M+",
      label: "Tutor Payouts",
      icon: Banknote,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const popularCourses = [
    { code: "MTH 101", name: "Calculus", icon: "📐" },
    { code: "PHY 102", name: "Physics", icon: "⚡" },
    { code: "CHM 101", name: "Chemistry", icon: "🧪" },
    { code: "GST 111", name: "Gen Studies", icon: "📚" },
    { code: "LAW 101", name: "Legal System", icon: "⚖️" },
  ];

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">

      {/* ── Navbar (No hamburger clutter, clean & balanced) ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-background/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex justify-between items-center">
          <Logo size={36} />

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#for-students" className="hover:text-white transition-colors">Students</a>
            <a href="#for-tutors" className="hover:text-white transition-colors">Tutors</a>
            <Link href="/past-questions" className="text-accent font-bold hover:text-accent/80 transition-colors flex items-center gap-1.5">
              <span>Past Questions & CBT</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent uppercase font-extrabold">Hot</span>
            </Link>
            <Link href="/cgpa-calculator" className="text-white/80 hover:text-white font-medium transition-colors">
              CGPA Calc
            </Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>

          {/* Right Action Buttons (Both mobile & desktop, no hamburger) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowInstallApp(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm"
              title="Install Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Get App</span>
            </button>
            <Link
              href="/login"
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border border-white/5 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all whitespace-nowrap shadow-sm shadow-primary/20"
            >
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Balanced, shape-rich, not jampacked to one side) ── */}
      <section className="relative overflow-hidden py-8 sm:py-16 md:py-20">
        {/* Background photo & gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/students-group.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background hero-photo-overlay-v" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">

          {/* ── 1. Centered Hero Intro ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-6 sm:mb-8"
          >
            {/* Pill badge shape */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Campus Peer Tutoring & CBT Prep</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-extrabold leading-tight tracking-tight text-white mb-2.5 sm:mb-3">
              Ace Your Exams With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-emerald-400">
                Top Campus Tutors
              </span>
            </h1>

            {/* Clean one-line subtext */}
            <p className="text-xs sm:text-sm md:text-base text-white/70 max-w-lg mx-auto mb-5 leading-relaxed">
              1-on-1 exam prep, past questions, and syllabus guidance from verified scholars who passed your courses with A's.
            </p>

            {/* Centered Dual CTAs */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 max-w-md mx-auto">
              <Link
                href="/register/student"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span>Find a Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register/tutor"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm text-white font-semibold text-xs sm:text-sm hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <span>Become a Tutor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* ── 2. Visual Shapes & Interactive Cards Showcase ── */}
          <div className="space-y-4">

            {/* Shape A: Featured Tutor Live Preview Card (Card Shape) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl p-4 sm:p-5 bg-card/90 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-emerald-500/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-extrabold text-white text-base shadow">
                      CE
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                      <BadgeCheck className="w-3 h-3 text-black" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-white">Chioma E.</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        Verified Tutor
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      UNILAG · 5.0 CGPA Scholar · Electrical Eng
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      <span>4.95</span>
                      <span className="text-muted-foreground text-[10px] font-normal">(58 sessions)</span>
                    </div>
                    <p className="text-emerald-400 font-black text-xs sm:text-sm">₦2,500 / hr</p>
                  </div>

                  <Link
                    href="/register/student"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    Book Session
                  </Link>
                </div>
              </div>

              {/* Subject pill shapes */}
              <div className="pt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold mr-1">Aced Courses:</span>
                {["MTH 101 Calculus", "PHY 102 Mechanics", "ENGR 201 Derivations", "GST 111"].map(c => (
                  <span key={c} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/5 text-white/90">
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Shape B: Dual Role Card Shapes (Side-by-Side Shapes on Mobile) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Student Squircle */}
              <Link
                href="/register/student"
                className="group rounded-3xl p-4 bg-gradient-to-br from-cyan-950/30 via-card to-card border border-cyan-500/30 hover:border-cyan-500/60 transition-all flex flex-col justify-between min-h-[140px] shadow-sm active:scale-[0.98]"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white mb-0.5">I Want To Learn</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    1-on-1 prep, CBT past papers & exam derivations.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-cyan-400 mt-2">
                  <span>Find Tutors</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Tutor Squircle */}
              <Link
                href="/register/tutor"
                className="group rounded-3xl p-4 bg-gradient-to-br from-emerald-950/30 via-card to-card border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between min-h-[140px] shadow-sm active:scale-[0.98]"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white mb-0.5">I Want To Teach</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    Earn ₦50K–₦200K+ monthly on your own schedule.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-2">
                  <span>Start Earning</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>

            {/* Shape C: Quick Course Search & Popular Pill Shapes */}
            <div className="rounded-3xl p-4 bg-card/70 border border-white/10 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/90 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-accent" />
                  Popular University Courses
                </span>
                <Link href="/past-questions" className="text-[10px] font-bold text-accent hover:underline flex items-center gap-0.5">
                  View CBT Bank <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Course pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {popularCourses.map((c) => (
                  <Link
                    key={c.code}
                    href={`/student/find-tutor?course=${c.code}`}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold active:scale-95 transition-all"
                  >
                    <span>{c.icon}</span>
                    <span className="font-bold">{c.code}</span>
                    <span className="text-[10px] text-muted-foreground">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Shape D: 4 Campus Features Squircles (2x2 Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { title: "2torBoard", desc: "Live Whiteboard", icon: PenTool, href: "/whiteboard", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                { title: "Past Qs & CBT", desc: "10,000+ Exam Bank", icon: GraduationCap, href: "/past-questions", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
                { title: "Daily Quiz", desc: "Speed Exam Streaks", icon: Flame, href: "/arena", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                { title: "Study Lounge", desc: "24/7 Focus Audio", icon: Headphones, href: "/study-lounge", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-2xl p-3 bg-card border border-white/5 hover:border-white/20 transition-all flex items-center gap-2.5 active:scale-95"
                >
                  <div className={`w-8 h-8 rounded-xl ${item.bg} border flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ── Stats Bar (4 Balanced Squircles) ── */}
      <section className="px-4 sm:px-6 py-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
          {heroStats.map((s) => (
            <div key={s.label} className={`p-3 rounded-2xl ${s.bg} border flex flex-col items-center`}>
              <s.icon className={`w-4 h-4 ${s.color} mb-1`} />
              <div className={`text-base sm:text-lg font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-white/70 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works (3 Clean Numbered Cards) ── */}
      <section id="how-it-works" className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-6 sm:mb-10">
            <p className="text-accent text-[11px] font-bold tracking-widest uppercase mb-1.5">Simple Process</p>
            <h2 className="text-xl sm:text-3xl font-display font-extrabold text-white">How 2torConnect Works</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-md mx-auto">Takes under 2 minutes to get set up.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
            {[
              { step: "01", icon: Users, title: "Create Your Account", desc: "Sign up as a student or apply as a tutor. Students get instant access; tutors pass quick ID check." },
              { step: "02", icon: Target, title: "Find Your Match", desc: "Filter by subject code, university, rating, and hourly rate. Read genuine student reviews." },
              { step: "03", icon: Calendar, title: "Book & Learn", desc: "Pick a time slot, connect via live video with whiteboard, and ace your coursework." },
            ].map((item, i) => (
              <motion.div key={item.step} {...fadeUp(i * 0.1)} className="rounded-3xl p-5 bg-card border border-white/10 relative overflow-hidden group hover:border-accent/40 transition-all">
                <div className="absolute top-3 right-4 text-3xl sm:text-4xl font-extrabold text-white/10 font-display">{item.step}</div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">{item.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Students & For Tutors (Dual Balanced Sections) ── */}
      <section id="for-students" className="py-10 sm:py-16 px-4 sm:px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Student Feature Box */}
          <div className="rounded-3xl p-5 sm:p-6 bg-card border border-cyan-500/20 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase">
              For Students
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white">
              Learn from peers who lived your syllabus.
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Our tutors know your lecturers' past questions, marking schemes, and exam tricks because they scored A's in those exact classrooms.
            </p>
            <div className="space-y-2 pt-1">
              {[
                "Search by university and course code",
                "Affordable peer rates from ₦1,000–₦5,000",
                "10,000+ past questions with step-by-step solutions",
              ].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-white/80">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <Link
              href="/register/student"
              className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold text-cyan-400 hover:underline"
            >
              <span>Join as Student Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tutor Feature Box */}
          <div className="rounded-3xl p-5 sm:p-6 bg-card border border-emerald-500/20 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
              For Tutors
            </div>
            <h3 className="text-base sm:text-xl font-bold text-white">
              Turn your high GPA into reliable income.
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Teach courses you already mastered. Set your own session price, choose your weekly available hours, and withdraw earnings to your bank account anytime.
            </p>
            <div className="space-y-2 pt-1">
              {[
                "Earn ₦50,000–₦200,000+ monthly on campus",
                "Generate WhatsApp flyers in one click",
                "Built-in digital whiteboard & voice messages",
              ].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-white/80">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <Link
              href="/register/tutor"
              className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold text-emerald-400 hover:underline"
            >
              <span>Apply as a Tutor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Universities Marquee ── */}
      <section className="py-8 px-4 sm:px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-white/40 text-[11px] mb-3.5 uppercase tracking-widest font-semibold">Tutors & Students across campuses</p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 text-white/70 text-xs font-medium">
            {["UNILAG", "UI Ibadan", "OAU Ife", "ABU Zaria", "UNN Nsukka", "FUTA", "UNIBEN", "LASU", "Covenant", "UNILORIN"].map(uni => (
              <span key={uni} className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80">{uni}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-6 sm:mb-8">
            <p className="text-accent text-[11px] font-bold tracking-widest uppercase mb-1">FAQ</p>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-2.5">
            {[
              { q: "How are tutors verified?", a: "Every tutor application is verified by checking university student ID, course grades, and academic transcript." },
              { q: "How much does a session cost?", a: "Tutors set their own hourly rates (typically ₦1,000–₦5,000). There are zero subscription fees." },
              { q: "How do tutors get paid?", a: "Earnings credit immediately upon session completion to your wallet, and can be withdrawn directly to your Nigerian bank account anytime." },
              { q: "What courses are covered?", a: "All faculties: Engineering, Sciences, Law, Medicine, Social Sciences, Arts, and Management." },
            ].map((faq, i) => (
              <motion.details key={i} {...fadeUp(i * 0.04)}
                className="rounded-2xl p-4 bg-card border border-white/5 group cursor-pointer">
                <summary className="text-white font-semibold text-xs sm:text-sm flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-white/60 mt-2.5 leading-relaxed text-xs">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Card ── */}
      <section className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-primary/20 via-card to-emerald-950/20 border border-white/10 shadow-xl">
            <h2 className="text-xl sm:text-3xl font-display font-extrabold text-white mb-2">
              Ready to learn smarter and earn on campus?
            </h2>
            <p className="text-white/70 text-xs sm:text-sm mb-5 max-w-md mx-auto">
              Join thousands of university scholars getting 1-on-1 tutoring and acing semester exams.
            </p>
            <div className="flex items-center justify-center gap-2.5 max-w-sm mx-auto">
              <Link
                href="/register/student"
                className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                Get Started Free
              </Link>
              <Link
                href="/register/tutor"
                className="flex-1 py-2.5 sm:py-3 rounded-xl border border-white/20 text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition-all active:scale-95"
              >
                Apply as Tutor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-xs text-white/50">Connecting university students with verified peer tutors.</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <Link href="/past-questions" className="hover:text-white">Past Qs</Link>
              <Link href="/cgpa-calculator" className="hover:text-white">CGPA</Link>
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/login" className="hover:text-white">Sign In</Link>
            </div>
          </div>
          <div className="border-t border-white/5 mt-4 pt-4 text-center text-[11px] text-white/30">
            © 2026 2torConnect. All rights reserved.
          </div>
        </div>
      </footer>

      {showInstallApp && (
        <InstallAppModal onClose={() => setShowInstallApp(false)} />
      )}
    </div>
  );
}
