import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Users, Star, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-30 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      
      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 rounded-xl" />
          <span className="font-display font-bold text-2xl text-white tracking-tight">3tor<span className="text-accent">Connect</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2.5 text-sm font-semibold text-white hover:text-accent transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-background hover:bg-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 border-accent/30">
            <span className="flex w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold text-accent tracking-wider uppercase">Nigeria's #1 Tutoring Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white leading-tight mb-8">
            Master your studies with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-300%">
              expert peer tutors.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Connect with top-performing students in your university. Get personalized help, ace your exams, or become a tutor and earn while you learn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register/student" className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto justify-center">
              Find a Tutor <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/register/tutor" className="group flex items-center gap-3 px-8 py-4 rounded-2xl glass-panel text-white font-bold text-lg hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto justify-center">
              Become a Tutor
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left"
        >
          {[
            { icon: Users, title: "Verified Peers", desc: "Learn from students who have actually aced the exact courses you're taking." },
            { icon: Zap, title: "Instant Booking", desc: "Schedule sessions instantly with real-time availability and seamless payments." },
            { icon: ShieldCheck, title: "Secure Platform", desc: "Safe messaging, secure transactions, and a robust rating system." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl hover:border-accent/50 transition-colors duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
