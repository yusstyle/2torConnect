import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import {
  LogOut, LayoutDashboard, Users, BookOpen,
  CreditCard, MessageSquare, Calendar,
  Search, FileText, Menu, X, Video, Globe, GraduationCap, UserCircle, HandCoins, Wallet, Sparkles,
  Trophy, Gift, Users2, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";

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

function ConnectFeedBadge() {
  return (
    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold leading-none">
      NEW
    </span>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export function DashboardLayout({ children, role: roleProp, title }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
      { label: "AI Study Assistant", href: "/student/ai-assistant", icon: Sparkles },
      { label: "My Wallet", href: "/student/wallet", icon: Wallet },
      { label: "Sponsorship", href: "/student/sponsorship", icon: HandCoins },
      { label: "Assignments Board", href: "/student/assignments", icon: ClipboardList },
      { label: "Group Sessions", href: "/group-sessions", icon: Users2 },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Refer & Earn", href: "/referral", icon: Gift },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "ConnectFeed", href: "/socialise", icon: Globe },
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
    tutor: [
      { label: "Dashboard", href: "/tutor/dashboard", icon: LayoutDashboard },
      { label: "My Sessions", href: "/tutor/sessions", icon: BookOpen },
      { label: "Live Sessions", href: "/tutor/live", icon: Video },
      { label: "Materials", href: "/tutor/materials", icon: FileText },
      { label: "Availability", href: "/tutor/availability", icon: Calendar },
      { label: "Earnings", href: "/tutor/earnings", icon: CreditCard },
      { label: "Assignments Board", href: "/tutor/assignments", icon: ClipboardList },
      { label: "Group Sessions", href: "/group-sessions", icon: Users2 },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Refer & Earn", href: "/referral", icon: Gift },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "ConnectFeed", href: "/socialise", icon: Globe },
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
    investor: [
      { label: "Dashboard", href: "/investor/dashboard", icon: LayoutDashboard },
      { label: "Sponsor a University", href: "/investor/universities", icon: GraduationCap },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Refer & Earn", href: "/referral", icon: Gift },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "ConnectFeed", href: "/socialise", icon: Globe },
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
    admin: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Sessions", href: "/admin/sessions", icon: BookOpen },
      { label: "Transactions", href: "/admin/transactions", icon: CreditCard },
      { label: "ConnectFeed", href: "/socialise", icon: Globe },
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
  };

  const currentNav = navItems[role] || navItems[user.role] || [];

  const roleGradient: Record<string, string> = {
    student: "from-accent to-primary",
    tutor: "from-primary to-purple-600",
    investor: "from-yellow-500 to-orange-400",
    admin: "from-red-500 to-pink-500",
  };

  const sidebarVisible = !isMobile || mobileMenuOpen;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size={32} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/profile" className={`w-9 h-9 rounded-full bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden border-2 border-white/20`}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span>{user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
            }
          </Link>
        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarVisible && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -280 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -280 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 glass-panel border-r border-y-0 border-l-0 flex flex-col"
          >
            <div className="p-5 hidden md:flex items-center justify-between border-b border-white/5">
              <Logo size={44} />
              <NotificationBell />
            </div>

            {/* Mobile sidebar header */}
            <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/5">
              <Logo size={36} />
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4 flex-1 overflow-y-auto">
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}>
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span>{user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className={`text-xs capitalize font-medium ${user.role === "investor" ? "text-yellow-400" : user.role === "admin" ? "text-red-400" : "text-accent"}`}>{user.role === "investor" ? "Sponsor" : user.role}</p>
                </div>
                <UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-white ml-auto shrink-0 transition-colors" />
              </Link>

              <nav className="space-y-0.5">
                {currentNav.map((item) => {
                  const isActive = location === item.href || location.startsWith(item.href + "/");
                  const isFeed = item.href === "/socialise";
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      } ${isFeed ? "mt-2 border-t border-white/5 pt-4" : ""}`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-accent" : isFeed ? "text-accent/70 group-hover:text-accent" : "group-hover:text-accent transition-colors"}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isFeed && !isActive && <ConnectFeedBadge />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-white/5">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive hover:border hover:border-destructive/30 transition-all duration-200">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {title && <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-5">{title}</h1>}
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
