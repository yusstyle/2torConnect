import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import {
  BookOpen, Users, Star, ArrowRight, ShieldCheck, Zap, CheckCircle,
  TrendingUp, Clock, MessageSquare, Award, Target, GraduationCap,
  Banknote, Calendar, ChevronRight, ChevronDown, HandCoins, Video, Globe2, Heart, Smartphone,
  PenTool, Layers, Headphones, Mic, Flame
} from "lucide-react";
import InstallAppModal from "@/components/InstallAppModal";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
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
      label: "Students Enrolled",
      icon: Users,
      color: "text-accent",
    },
    {
      value: stats ? formatCount(stats.totalTutors) : "1,200+",
      label: "Verified Tutors",
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      value: stats ? formatCount(stats.universities) : "45+",
      label: "Universities",
      icon: Award,
      color: "text-yellow-400",
    },
    {
      value: stats ? formatEarnings(stats.totalRevenue) : "₦4.5M+",
      label: "Earned by Tutors",
      icon: Banknote,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-background/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <Logo size={38} />

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#for-students" className="hover:text-white transition-colors">For Students</a>
            <a href="#for-tutors" className="hover:text-white transition-colors">For Tutors</a>
            <Link href="/past-questions" className="text-accent font-bold hover:text-accent/80 transition-colors flex items-center gap-1.5">
              <span>Past Questions & CBT</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent uppercase font-extrabold">Hot</span>
            </Link>
            <Link href="/cgpa-calculator" className="text-white/80 hover:text-white font-medium transition-colors">
              CGPA Calculator
            </Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowInstallApp(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm"
              title="Install Android / iOS Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get App</span>
            </button>
            <Link href="/login" className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors whitespace-nowrap">
              Sign In
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all duration-300 whitespace-nowrap shadow-sm shadow-primary/20">
              Join Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-10 sm:py-16 md:py-20 lg:py-24">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/students-group.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70 hero-photo-overlay-h" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70 hero-photo-overlay-v" />
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            {/* Pill badge - clean & compact on mobile with generous gap */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 mb-5 sm:mb-6">
              <span className="flex w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-accent tracking-wider uppercase">
                Verified Campus Peer Tutors
              </span>
            </div>

            {/* Headline with good gap */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight mb-4 sm:mb-6">
              Connect with the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                best tutors
              </span>{" "}
              in your university
            </h1>

            {/* Concise, human subtitle with good gap */}
            <p className="text-xs sm:text-base md:text-lg text-white/70 leading-relaxed mb-6 sm:mb-8 max-w-xl">
              Get 1-on-1 exam prep, past questions, and coursework guidance from verified students who aced your exact courses — or earn on your own schedule by tutoring.
            </p>

            {/* Action buttons with comfortable mobile touch targets & gap */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 w-full sm:w-auto">
              <Link
                href="/register/student"
                className="flex items-center justify-center gap-2 px-5 py-3.5 sm:px-7 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm sm:text-base shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                <span>Find a Tutor Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register/tutor"
                className="flex items-center justify-center gap-2 px-5 py-3.5 sm:px-7 sm:py-4 rounded-xl sm:rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm text-white font-semibold text-sm sm:text-base hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <span>Become a Tutor</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust checklist tags with generous gap before stats section */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/60 mb-8 sm:mb-12">
              {["Free to join", "Verified tutors", "Secure payouts"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-medium text-white/80">
                  <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{t}</span>
                </span>
              ))}
            </div>
          </motion.div>

          {/* Stats card floating on right (Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {heroStats.map((stat) => (
              <div key={stat.label} className="glass-panel rounded-3xl p-6 flex flex-col gap-3 hover:border-accent/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`text-3xl font-extrabold font-display ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar (mobile) with clear gap from the hero above ── */}
      <section className="lg:hidden px-4 py-8 sm:py-10 bg-white/[0.02] border-y border-white/5">
        <div className="grid grid-cols-2 gap-3 text-center">
          {heroStats.map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
              <s.icon className={`w-5 h-5 ${s.color} mb-1.5`} />
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-white/60 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-14">
            <p className="text-accent text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">Simple Process</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white">How 2torConnect Works</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xl mx-auto">Getting started takes under 2 minutes. Whether you need tutoring or want to teach, we have you covered.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: "01", icon: Users, title: "Create Your Account", desc: "Sign up as a student or apply as a tutor. Students are active immediately; tutors undergo quick ID verification." },
              { step: "02", icon: Target, title: "Find Your Match", desc: "Search tutors by course code, university, rating, and hourly rate. Read genuine student reviews." },
              { step: "03", icon: Calendar, title: "Book & Learn", desc: "Pick a convenient time slot, book with wallet or bank transfer, and join live 1-on-1 audio/video with whiteboard." },
            ].map((item, i) => (
              <motion.div key={item.step} {...fadeUp(i * 0.1)} className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden group hover:border-accent/40 transition-all duration-300">
                <div className="absolute top-3 right-5 text-4xl sm:text-6xl font-extrabold text-white/10 font-display group-hover:text-white/20 transition-colors">{item.step}</div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Students ── */}
      <section id="for-students" className="py-12 sm:py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/student-bg.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70 section-photo-overlay-h-r" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background section-photo-overlay-v" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <motion.div {...fadeUp()}>
            <p className="text-accent text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">For Students</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
              Stop struggling alone. Learn from peers who aced your course.
            </h2>
            <p className="text-white/70 text-xs sm:text-base leading-relaxed mb-6">
              Our tutors are top-performing students from your university who know your lecturers' exam questions, course syllabus, and grading schemes because they passed with A's.
            </p>

            <div className="space-y-3 mb-6 sm:mb-8">
              {[
                { title: "Course-specific tutors", desc: "Search by course code (MTH101, GST, Engineering) and university." },
                { title: "Flexible scheduling", desc: "Book around your lecture timetable and practical classes." },
                { title: "Affordable student rates", desc: "Peer-friendly pricing from ₦1,000–₦5,000 per session." },
                { title: "CBT past questions included", desc: "Practice timed JAMB, Post-UTME, and 100L exams for free." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xs sm:text-sm">{item.title}</p>
                    <p className="text-white/60 text-[11px] sm:text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/register/student"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
            >
              <span>Join as a Student Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Testimonial card */}
          <motion.div {...fadeUp(0.15)} className="space-y-3">
            {[
              { name: "Chioma A.", uni: "UNILAG · 300L Engineering", stars: 5, text: "I was struggling with MTH 301 before finding my tutor here. Within 3 sessions I went from a D to a B+." },
              { name: "Emeka O.", uni: "UI · 200L Medicine", stars: 5, text: "The biochemistry tutor explained concepts in straightforward terms. Best investment this semester." },
              { name: "Fatima B.", uni: "ABU Zaria · 400L Law", stars: 5, text: "Finding someone who took Law of Contract at ABU and broke it down was priceless. Got an A!" },
            ].map((t, i) => (
              <div key={i} className="glass-panel rounded-2xl p-4 sm:p-5">
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-xs sm:text-sm italic mb-2">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-xs">{t.name}</p>
                  <p className="text-white/50 text-[10px]">{t.uni}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── For Tutors ── */}
      <section id="for-tutors" className="py-12 sm:py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-right"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/tutor-bg.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/95 to-background/70 section-photo-overlay-h-l" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background section-photo-overlay-v" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <motion.div {...fadeUp()} className="grid grid-cols-2 gap-2.5 sm:gap-4 order-2 lg:order-1">
            {[
              { icon: Banknote, title: "Set your price", desc: "Charge ₦1,000–₦10,000+ per session based on your expertise.", color: "text-emerald-400" },
              { icon: Clock, title: "Your schedule", desc: "Set weekly available timeslots and accept bookings at your convenience.", color: "text-blue-400" },
              { icon: TrendingUp, title: "Direct payouts", desc: "Earnings credit to wallet instantly. Withdraw directly to bank.", color: "text-yellow-400" },
              { icon: MessageSquare, title: "Live teaching tools", desc: "Interactive whiteboard, voice notes, and live video room included.", color: "text-purple-400" },
            ].map((card) => (
              <div key={card.title} className="glass-panel rounded-2xl p-4 sm:p-5 hover:border-primary/40 transition-colors">
                <div className={`${card.color} mb-2`}><card.icon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                <h4 className="text-white font-bold text-xs sm:text-sm mb-1">{card.title}</h4>
                <p className="text-white/60 text-[11px] sm:text-xs leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="order-1 lg:order-2">
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">For Tutors</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
              Turn your academic excellence into reliable income.
            </h2>
            <p className="text-white/70 text-xs sm:text-base leading-relaxed mb-6">
              You worked hard for your high GPA. Now share your knowledge, help junior scholars excel, and earn on your own campus timetable.
            </p>

            <div className="space-y-2 mb-6 sm:mb-8">
              {[
                "Earn ₦50,000–₦300,000+ monthly teaching courses you aced",
                "Generate WhatsApp flyers with your photo and subjects in one click",
                "Instant payouts directly to any Nigerian commercial or fintech bank",
                "Built-in 2torBoard whiteboard and recorded audio pitch",
              ].map((item) => (
                <div key={item} className="flex gap-2.5 items-start">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-white/70 text-xs sm:text-sm">{item}</p>
                </div>
              ))}
            </div>

            <Link
              href="/register/tutor"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-all"
            >
              <span>Apply as a Tutor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── For Investors & Sponsors ── */}
      <section id="for-investors" className="py-12 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-background to-orange-500/5" />
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
              <Heart className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-yellow-400 tracking-wider uppercase">For Campus Sponsors</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6 leading-tight">
              Sponsor a student. <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Empower a tutor.</span>
            </h2>
            <p className="text-white/70 text-xs sm:text-base leading-relaxed mb-6">
              Connect directly with verified scholars through live video, fund exam prep and tuition, and provide teaching tablets and materials. 100% transparent and verified.
            </p>

            <Link
              href="/register/investor"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-all"
            >
              <span>Become a Sponsor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="space-y-3">
            <div className="glass-panel rounded-2xl p-5 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <h4 className="text-white font-bold text-sm">Direct Student Aid</h4>
              </div>
              <p className="text-white/70 text-xs">Sponsor session vouchers, textbook fees, or exam registration for indigent students across Nigerian institutions.</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <h4 className="text-white font-bold text-sm">Equip Top Tutors</h4>
              </div>
              <p className="text-white/70 text-xs">Fund stylus tablets, internet subscriptions, and teaching grants for high-performing student tutors.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-14">
            <p className="text-accent text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">Campus Ecosystem</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white">Built for students who want to excel</h2>
            <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xl mx-auto">Every tool designed around your Nigerian university curriculum and campus study habits.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {[
              { icon: PenTool, title: "2torBoard: Live Whiteboard", desc: "Collaborate and sketch math derivations, physics formulas, and circuit diagrams live in session.", color: "from-cyan-500/20 to-cyan-500/5" },
              { icon: Mic, title: "In-Call Voice Notes", desc: "Send quick audio clips in messages and live video sessions without breaking lecture flow.", color: "from-emerald-500/20 to-emerald-500/5" },
              { icon: Flame, title: "Daily Practice Quiz", desc: "5 rapid exam questions daily from authentic past papers. Build study streaks and earn bonus XP.", color: "from-emerald-500/20 to-teal-500/5" },
              { icon: Layers, title: "2torCards: Flashcards", desc: "Active recall flip cards for Calculus, GST, Organic Chemistry, and custom course decks.", color: "from-purple-500/20 to-purple-500/5" },
              { icon: Headphones, title: "24/7 Study Lounge", desc: "Pomodoro study timer paired with ambient tropical rainfall and deep-focus alpha waves.", color: "from-yellow-500/20 to-yellow-500/5" },
              { icon: GraduationCap, title: "10,000+ Past Qs & CBT", desc: "Full CBT exam simulator for JAMB, Post-UTME, and university 100L semester exams.", color: "from-primary/20 to-primary/5" },
            ].map((feature, i) => (
              <motion.div key={feature.title} {...fadeUp(i * 0.08)}
                className="glass-panel rounded-2xl p-5 group hover:border-white/20 transition-all">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{feature.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Universities ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/40 text-xs mb-5 uppercase tracking-widest font-semibold">Tutors & Students across universities</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-white/60 text-xs font-medium">
            {["UNILAG", "UI Ibadan", "OAU Ife", "ABU Zaria", "UNN Nsukka", "FUTA", "UNIBEN", "LASU", "Covenant University", "Babcock", "UNILORIN"].map(uni => (
              <span key={uni} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-accent/30 text-white/80 transition-colors">{uni}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8 sm:mb-12">
            <p className="text-accent text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">FAQ</p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-white">Frequently asked questions</h2>
          </motion.div>
          <div className="space-y-3">
            {[
              { q: "How are tutors verified?", a: "Every tutor application is verified by reviewing university student ID, course grades, and academic transcript before approval." },
              { q: "How much does a session cost?", a: "Tutors set their own hourly rate (typically ₦1,000–₦5,000 per session). There are zero subscription fees." },
              { q: "How do tutors get paid?", a: "Earnings credit immediately upon session completion to your wallet, and can be withdrawn directly to your Nigerian bank account anytime." },
              { q: "What courses are covered?", a: "All faculties: Engineering, Sciences, Law, Medicine, Social Sciences, Arts, and Management." },
            ].map((faq, i) => (
              <motion.details key={i} {...fadeUp(i * 0.05)}
                className="glass-panel rounded-2xl p-4 sm:p-5 group cursor-pointer">
                <summary className="text-white font-semibold text-xs sm:text-sm flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-white/60 mt-3 leading-relaxed text-xs">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp()} className="glass-panel rounded-3xl p-6 sm:p-12 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3 sm:mb-5">
                Ready to take control of your grades?
              </h2>
              <p className="text-white/70 text-xs sm:text-base mb-6 sm:mb-8 max-w-lg mx-auto">
                Join thousands of university scholars learning smarter and earning on their own terms. Free to sign up.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register/student"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/30 hover:opacity-90 transition-all w-full sm:w-auto"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register/tutor"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition-all w-full sm:w-auto"
                >
                  Apply as a Tutor
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <Logo size={32} />
              </div>
              <p className="text-white/50 text-xs leading-relaxed max-w-xs">
                Connecting university students with verified peer tutors who aced their exact courses.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-white/50 text-xs">
                <li><Link href="/past-questions" className="hover:text-white transition-colors">Past Questions & CBT</Link></li>
                <li><Link href="/cgpa-calculator" className="hover:text-white transition-colors">5.0 CGPA Calculator</Link></li>
                <li><Link href="/register/student" className="hover:text-white transition-colors">Find a Tutor</Link></li>
                <li><Link href="/register/tutor" className="hover:text-white transition-colors">Become a Tutor</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Support</h4>
              <ul className="space-y-2 text-white/50 text-xs">
                <li><Link href="/about" className="hover:text-white transition-colors">About 2torConnect</Link></li>
                <li><Link href="/messages" className="hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-white/30 text-xs">© 2026 2torConnect. All rights reserved.</p>
            <p className="text-white/30 text-xs">Built for university students everywhere</p>
          </div>
        </div>
      </footer>

      {showInstallApp && (
        <InstallAppModal onClose={() => setShowInstallApp(false)} />
      )}
    </div>
  );
}
