import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import {
  LogOut, LayoutDashboard, Users, BookOpen,
  CreditCard, MessageSquare, Calendar,
  Search, FileText, Menu, X, Video, Building2, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  accent?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role?: string;
  title?: string;
}

function SocialiseBadge() {
  return (
    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold leading-none">
      NEW
    </span>
  );
}

export function DashboardLayout({ children, role: roleProp, title }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) { setLocation("/login"); return null; }

  const handleLogout = () => { logout(); setLocation("/"); };
  const role = roleProp ?? user.role;

  const navItems: Record<string, NavItem[]> = {
    student: [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Find a Tutor", href: "/student/find-tutor", icon: Search },
      { label: "My Sessions", href: "/student/sessions", icon: BookOpen },
      { label: "Live Sessions", href: "/student/live", icon: Video },
      { label: "Study Materials", href: "/student/materials", icon: FileText },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "2torSocialise", href: "/socialise", icon: Globe },
    ],
    tutor: [
      { label: "Dashboard", href: "/tutor/dashboard", icon: LayoutDashboard },
      { label: "My Sessions", href: "/tutor/sessions", icon: BookOpen },
      { label: "Live Sessions", href: "/tutor/live", icon: Video },
      { label: "Materials", href: "/tutor/materials", icon: FileText },
      { label: "Availability", href: "/tutor/availability", icon: Calendar },
      { label: "Earnings", href: "/tutor/earnings", icon: CreditCard },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "2torSocialise", href: "/socialise", icon: Globe },
    ],
    investor: [
      { label: "Dashboard", href: "/investor/dashboard", icon: LayoutDashboard },
      { label: "Browse Students", href: "/investor/students", icon: Users },
      { label: "Browse Tutors", href: "/investor/tutors", icon: BookOpen },
      { label: "Live Sessions", href: "/investor/live", icon: Video },
      { label: "Transactions", href: "/investor/transactions", icon: CreditCard },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "2torSocialise", href: "/socialise", icon: Globe },
    ],
    admin: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Sessions", href: "/admin/sessions", icon: BookOpen },
      { label: "Transactions", href: "/admin/transactions", icon: CreditCard },
      { label: "2torSocialise", href: "/socialise", icon: Globe },
    ],
  };

  const currentNav = navItems[role] || navItems[user.role] || [];

  const roleGradient: Record<string, string> = {
    student: "from-accent to-primary",
    tutor: "from-primary to-purple-600",
    investor: "from-yellow-500 to-orange-400",
    admin: "from-red-500 to-pink-500",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="font-display font-bold text-xl text-white flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">2T</span>
          </div>
          2torConnect
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-muted-foreground">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(mobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
            className="fixed md:static inset-y-0 left-0 z-50 w-64 glass-panel border-r border-y-0 border-l-0 flex flex-col"
          >
            <div className="p-6 hidden md:flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center shadow-lg`}>
                <span className="text-white text-lg font-bold font-display">2T</span>
              </div>
              <span className="font-display font-bold text-2xl text-white tracking-tight">2tor<span className="text-accent">Connect</span></span>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center font-bold text-white`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white truncate w-32">{user.name}</p>
                  <p className={`text-xs capitalize font-medium ${user.role === "investor" ? "text-yellow-400" : user.role === "admin" ? "text-red-400" : "text-accent"}`}>{user.role}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {currentNav.map((item) => {
                  const isActive = location === item.href || location.startsWith(item.href + "/");
                  const isSocialise = item.href === "/socialise";
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      } ${isSocialise ? "mt-2 border-t border-white/5 pt-4" : ""}`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-accent" : isSocialise ? "text-accent/70 group-hover:text-accent" : "group-hover:text-accent transition-colors"}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isSocialise && !isActive && <SocialiseBadge />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-6 border-t border-white/5">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive hover:border hover:border-destructive/30 transition-all duration-200">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {title && <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">{title}</h1>}
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
