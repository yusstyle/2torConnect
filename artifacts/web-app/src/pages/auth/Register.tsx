import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";

export default function RegisterChoicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl relative z-10 w-full"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Join 3torConnect</h1>
        <p className="text-muted-foreground text-lg mb-12">How would you like to use the platform?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/register/student" className="block text-left">
            <div className="glass-panel p-8 rounded-3xl hover:border-accent hover:-translate-y-2 transition-all duration-300 group cursor-pointer h-full">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">I'm a Student</h3>
              <p className="text-muted-foreground">Find expert peers to help you master your courses and prepare for exams.</p>
              <div className="mt-8 text-accent font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Sign up as Student <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link href="/register/tutor" className="block text-left">
            <div className="glass-panel p-8 rounded-3xl hover:border-primary hover:-translate-y-2 transition-all duration-300 group cursor-pointer h-full">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">I'm a Tutor</h3>
              <p className="text-muted-foreground">Share your knowledge, help fellow students, and earn money on your own schedule.</p>
              <div className="mt-8 text-primary font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Apply as Tutor <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-12 text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
