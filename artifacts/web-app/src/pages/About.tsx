import { Link } from "wouter";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { MessageCircle, Instagram, ArrowLeft, Quote } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-background/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Logo size={42} />
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-xl opacity-40" />
            <img
              src="/images/founder.jpg"
              alt="Yusuf Hussaini, Founder of 2torConnect"
              className="relative w-40 h-40 rounded-full object-cover border-2 border-white/10"
            />
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white mb-3">
            Meet the <span className="text-accent">Founder</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            The story behind 2torConnect
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-panel rounded-3xl p-8 sm:p-10 space-y-6 text-white/80 leading-relaxed"
        >
          <p>
            <strong className="text-white">Yusuf Hussaini</strong>, also known as{" "}
            <strong className="text-white">Yusstyle Devtech</strong>, is a Senior Full-Stack Developer,
            Software Engineering student, and the founder and sole developer of 2torConnect.
          </p>
          <p>
            2torConnect was born from a simple idea: learning should not be limited by location,
            connections, or access to the right person.
          </p>
          <p>
            Driven by his passion for technology and innovation, Yusuf set out to build a platform
            that brings students and tutors closer together — giving students access to guidance
            while creating opportunities for tutors to share their knowledge and expertise.
          </p>
          <p>
            From the original idea to the code behind the platform, Yusuf has taken the journey of
            building 2torConnect himself. His work reflects his belief that technology should not
            only solve problems but also create opportunities, connect people, and empower the next
            generation.
          </p>
          <p>
            Through Yusstyle Devtech, Yusuf continues to explore software development, digital
            innovation, and the creation of technology-driven solutions.
          </p>
          <p>
            Today, 2torConnect represents a bigger vision: to build a global community where
            students and tutors can connect, learn, collaborate, and grow together.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative my-10 px-8 sm:px-12 py-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-white/5"
        >
          <Quote className="w-8 h-8 text-accent/40 mb-3" />
          <p className="text-xl sm:text-2xl font-medium text-white leading-snug italic">
            "I'm not just building an application. I'm building a platform that I hope will help
            change how students connect with knowledge and with the people who can help them grow."
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-16"
        >
          <p className="font-display font-bold text-white text-lg">Yusuf Hussaini (Yusstyle Devtech)</p>
          <p className="text-muted-foreground text-sm">Founder &amp; Lead Developer, 2torConnect</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-3xl p-8 sm:p-10 text-center"
        >
          <h2 className="font-display font-bold text-2xl text-white mb-2">Connect with the Founder</h2>
          <p className="text-muted-foreground mb-8">
            Follow my journey, connect with me, and stay updated on what I'm building.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/2349136453820" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
              <MessageCircle className="w-4 h-4 text-green-400" /> +234 913 645 3820
            </a>
            <a href="https://wa.me/2349047864019" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
              <MessageCircle className="w-4 h-4 text-green-400" /> +234 904 786 4019
            </a>
            <a href="https://instagram.com/Yusstyle_Devtech" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
              <Instagram className="w-4 h-4 text-pink-400" /> @Yusstyle Devtech
            </a>
            <a href="https://x.com/yusstyle13" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
              <span className="font-bold">𝕏</span> @yusstyle13
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/30 text-sm">© 2026 2torConnect. All rights reserved.</p>
      </footer>
    </div>
  );
}