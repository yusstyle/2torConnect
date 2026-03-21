import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Star, ArrowRight, ShieldCheck, Zap, CheckCircle,
  TrendingUp, Clock, MessageSquare, Award, Target, GraduationCap,
  Banknote, Calendar, ChevronRight
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <span className="text-white font-extrabold text-lg font-display">2T</span>
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">
              2tor<span className="text-accent">Connect</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#for-students" className="hover:text-white transition-colors">For Students</a>
            <a href="#for-tutors" className="hover:text-white transition-colors">For Tutors</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-300">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/students-group.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-8">
              <span className="flex w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold text-accent tracking-wider uppercase">Nigeria's #1 Peer Tutoring Platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-extrabold leading-tight mb-6">
              Connect with the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                best tutors
              </span>{" "}
              in your university
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl">
              2torConnect links Nigerian university students with top-performing peers who've aced the same courses. Get personalized, one-on-one academic support — or become a tutor and earn on your own schedule.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/register/student"
                className="group flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-base shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300">
                Find a Tutor Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/register/tutor"
                className="group flex items-center gap-3 px-7 py-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm text-white font-bold text-base hover:bg-white/10 hover:border-accent/50 hover:-translate-y-1 transition-all duration-300">
                Become a Tutor
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/50">
              {["Free to join", "Verified tutors", "Secure payments"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Stats card floating on right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {[
              { value: "10,000+", label: "Students Enrolled", icon: Users, color: "text-accent" },
              { value: "500+", label: "Verified Tutors", icon: GraduationCap, color: "text-primary" },
              { value: "50+", label: "Nigerian Universities", icon: Award, color: "text-yellow-400" },
              { value: "₦50M+", label: "Earned by Tutors", icon: Banknote, color: "text-green-400" },
            ].map((stat) => (
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

      {/* ── Stats bar (mobile) ── */}
      <section className="lg:hidden bg-white/3 border-y border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-6 text-center">
          {[
            { value: "10,000+", label: "Students" },
            { value: "500+", label: "Tutors" },
            { value: "50+", label: "Universities" },
            { value: "₦50M+", label: "Tutor Earnings" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-accent">{s.value}</div>
              <div className="text-sm text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">How 2torConnect Works</h2>
            <p className="text-white/60 mt-4 max-w-xl mx-auto">Getting started takes under 2 minutes. Whether you need help or want to teach, we've got you covered.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Users, title: "Create Your Account", desc: "Sign up as a student or apply as a tutor. Students are instantly active; tutors go through a quick verification." },
              { step: "02", icon: Target, title: "Find Your Match", desc: "Browse tutor profiles by subject, university, rating, and price. Read reviews from real students who've taken sessions." },
              { step: "03", icon: Calendar, title: "Book & Learn", desc: "Pick a time slot that works, make a secure payment, and start your session. It's that easy." },
            ].map((item, i) => (
              <motion.div key={item.step} {...fadeUp(i * 0.15)} className="glass-panel rounded-3xl p-8 relative overflow-hidden group hover:border-accent/40 transition-all duration-300">
                <div className="absolute top-4 right-6 text-6xl font-extrabold text-white/5 font-display group-hover:text-white/8 transition-colors">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Students ── */}
      <section id="for-students" className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/student-bg.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp()}>
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">For Students</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Stop struggling alone. Get help from students who've been there.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Our tutors are verified students from your university who've excelled in the exact courses you're taking. They understand your syllabus, your lecturers' style, and what's likely to come up in exams — because they've lived it.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { title: "Find subject-specific tutors", desc: "Search by course code, subject, or university. See ratings and reviews from real students." },
                { title: "Flexible scheduling", desc: "Book sessions at times that fit around your lectures, practicals, and social life." },
                { title: "Affordable pricing", desc: "Rates set by tutors — typically ₦1,000–₦5,000 per session, far cheaper than private coaching." },
                { title: "Track your progress", desc: "Monitor sessions, notes, and improvement across all your courses in one dashboard." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/register/student"
              className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 hover:shadow-xl hover:shadow-primary/40 transition-all">
              Join as a Student Free <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Testimonial card floating right */}
          <motion.div {...fadeUp(0.2)} className="space-y-4 hidden lg:block">
            {[
              { name: "Chioma A.", uni: "UNILAG · 300L Engineering", stars: 5, text: "I was struggling with MTH 301 before I found my tutor on 2torConnect. Within 3 sessions I went from a D to a B+. Absolutely life-changing!" },
              { name: "Emeka O.", uni: "UI · 200L Medicine", stars: 5, text: "The biochemistry tutor I got explained things in Yoruba mixed English — the way we actually think. Best investment I made this semester." },
              { name: "Fatima B.", uni: "ABU Zaria · 400L Law", stars: 5, text: "Finding someone who's taken Law of Contract at ABU and can break it down for me was priceless. Got my first A in 4 years!" },
            ].map((t, i) => (
              <div key={i} className="glass-panel rounded-2xl p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm italic mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.uni}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── For Tutors ── */}
      <section id="for-tutors" className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-right"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/tutor-bg.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/95 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Earning cards on left */}
          <motion.div {...fadeUp()} className="grid grid-cols-2 gap-4 hidden lg:grid">
            {[
              { icon: Banknote, title: "Set your own rate", desc: "Charge ₦1,000–₦10,000+ per session based on your expertise and demand.", color: "text-green-400" },
              { icon: Clock, title: "Work on your schedule", desc: "Set your available hours each week. Accept or decline any booking request.", color: "text-blue-400" },
              { icon: TrendingUp, title: "Grow your reputation", desc: "Build a 5-star profile with reviews. Top tutors get 20+ bookings per month.", color: "text-yellow-400" },
              { icon: MessageSquare, title: "Communicate easily", desc: "Built-in messaging keeps all student communication in one secure place.", color: "text-purple-400" },
            ].map((card) => (
              <div key={card.title} className="glass-panel rounded-3xl p-6 hover:border-primary/40 transition-colors">
                <div className={`${card.color} mb-3`}><card.icon className="w-7 h-7" /></div>
                <h4 className="text-white font-bold mb-2">{card.title}</h4>
                <p className="text-white/60 text-sm">{card.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">For Tutors</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Turn your academic excellence into a real income stream.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              You've worked hard for your grades — now let them pay you back. 2torConnect lets you monetise your knowledge by teaching the courses you've already aced. Set your own hours, your own rates, and build a student base that keeps coming back.
            </p>

            <div className="space-y-3 mb-10">
              {[
                "Earn ₦50,000–₦300,000+ per month depending on how many sessions you take",
                "Your tutor profile stays on the platform — students can find and rebook you anytime",
                "Receive payments securely and withdraw to your bank account",
                "Get rated and reviewed — 5-star tutors rise to the top of search results",
                "Simple dashboard to track all sessions, earnings, and student messages",
              ].map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-sm">{item}</p>
                </div>
              ))}
            </div>

            <Link href="/register/tutor"
              className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold hover:opacity-90 hover:shadow-xl hover:shadow-primary/40 transition-all">
              Apply as a Tutor <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-white/40 text-sm mt-4">Applications reviewed within 24–48 hours</p>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Why 2torConnect</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Built for Nigerian students, by Nigerian students</h2>
            <p className="text-white/60 mt-4 max-w-2xl mx-auto">We understand the unique challenges of Nigerian university education — from ASUU strikes to limited textbooks to complex exam formats. 2torConnect is designed around your reality.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "Verified Tutors Only", desc: "Every tutor goes through an identity and academic verification process. You always know who you're learning from.", color: "from-blue-500/20 to-blue-500/5" },
              { icon: Zap, title: "Instant Booking", desc: "See real-time tutor availability, book a slot, and get confirmed within minutes — not days.", color: "from-yellow-500/20 to-yellow-500/5" },
              { icon: Star, title: "Ratings & Reviews", desc: "Read honest reviews from real students before booking. Our rating system keeps quality consistently high.", color: "from-accent/20 to-accent/5" },
              { icon: BookOpen, title: "Subject Coverage", desc: "From Mathematics and Sciences to Law, Medicine, Engineering, and Humanities — we cover every faculty.", color: "from-green-500/20 to-green-500/5" },
              { icon: MessageSquare, title: "In-App Messaging", desc: "Communicate directly with your tutor or student through our secure built-in messaging system.", color: "from-purple-500/20 to-purple-500/5" },
              { icon: TrendingUp, title: "Progress Tracking", desc: "Log session notes, track your improvement over time, and see which subjects need the most attention.", color: "from-primary/20 to-primary/5" },
            ].map((feature, i) => (
              <motion.div key={feature.title} {...fadeUp(i * 0.1)}
                className="glass-panel rounded-3xl p-8 group hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Universities ── */}
      <section className="py-16 px-6 bg-white/2 border-y border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <motion.p {...fadeUp()} className="text-white/40 text-sm mb-8 uppercase tracking-widest">Tutors & Students from Nigeria's top universities</motion.p>
          <motion.div {...fadeUp(0.1)} className="flex flex-wrap justify-center gap-6 text-white/50 text-sm font-medium">
            {["University of Lagos (UNILAG)", "University of Ibadan (UI)", "Obafemi Awolowo University (OAU)", "ABU Zaria", "University of Nigeria Nsukka (UNN)", "LASU", "UNIABUJA", "Covenant University", "Babcock University", "Lagos Business School"].map(uni => (
              <span key={uni} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-accent/30 hover:text-white/80 transition-colors">{uni}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-4xl font-display font-bold text-white">Common questions</h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { q: "How are tutors verified?", a: "Every tutor application is reviewed by our team. We verify their identity, university enrollment, and academic records before approving their profile. Only tutors who meet our academic standards are listed." },
              { q: "How much does it cost?", a: "Students pay the session fee set by the tutor (typically ₦1,000–₦5,000 per hour). There are no monthly subscriptions or hidden fees. You only pay when you book a session." },
              { q: "How do tutors get paid?", a: "Earnings are credited to your 2torConnect wallet after each completed session. You can withdraw to your Nigerian bank account at any time." },
              { q: "What subjects are available?", a: "We cover all university subjects — Sciences, Arts, Engineering, Medicine, Law, Social Sciences, Business, and more. If you need a subject not listed, contact us and we'll try to find a match." },
              { q: "Can I cancel a booked session?", a: "Yes. Sessions can be cancelled up to 2 hours before the scheduled time for a full refund. Late cancellations may incur a small fee to compensate the tutor for their time." },
            ].map((faq, i) => (
              <motion.details key={i} {...fadeUp(i * 0.05)}
                className="glass-panel rounded-2xl p-6 group cursor-pointer">
                <summary className="text-white font-semibold flex items-center justify-between list-none">
                  {faq.q}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-white/60 mt-4 leading-relaxed text-sm">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp()} className="glass-panel rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10 rounded-3xl" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm text-accent font-semibold">Join 10,000+ students already learning smarter</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                Ready to take control of your academic future?
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                Whether you need help with your toughest course or want to earn from your knowledge — 2torConnect is where it starts. Free to join. No commitment needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register/student"
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-base shadow-xl shadow-primary/30 hover:opacity-90 hover:-translate-y-1 transition-all w-full sm:w-auto justify-center">
                  Get Started as a Student <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/register/tutor"
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/20 text-white font-bold text-base hover:bg-white/10 hover:-translate-y-1 transition-all w-full sm:w-auto justify-center">
                  Apply as a Tutor
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm font-display">2T</span>
                </div>
                <span className="font-display font-bold text-xl text-white">2tor<span className="text-accent">Connect</span></span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Nigeria's premier peer tutoring marketplace, connecting students with top-performing university peers for personalized academic support.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-3 text-white/50 text-sm">
                {["Find a Tutor", "Become a Tutor", "How it Works", "Pricing"].map(l => (
                  <li key={l}><a href="/register" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 text-white/50 text-sm">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"].map(l => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">© 2026 2torConnect. All rights reserved.</p>
            <p className="text-white/30 text-sm">Made with ❤️ for Nigerian students</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
