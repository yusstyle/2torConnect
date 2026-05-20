import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import {
  LogOut, LayoutDashboard, Users, BookOpen,
  CreditCard, MessageSquare, Calendar,
  Search, FileText, X, Video, Globe, GraduationCap, UserCircle, HandCoins, Wallet, Sparkles,
  Trophy, Gift, Users2, ClipboardList, MoreHorizontal, ChevronUp,
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
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!user) { setLocation("/login"); return null; }

  const handleLogout = () => { logout(); setLocation("/"); };
  const role = roleProp ?? user.role;

  const allNavItems: Record<string, NavItem[]> = {
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

  // Primary items shown in mobile bottom bar (max 4, + "More" button = 5 slots)
  const mobileBottomItems: Record<string, NavItem[]> = {
    student: [
      { label: "Home", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Tutors", href: "/student/find-tutor", icon: Search },
      { label: "Wallet", href: "/student/wallet", icon: Wallet },
      { label: "Messages", href: "/messages", icon: MessageSquare },
    ],
    tutor: [
      { label: "Home", href: "/tutor/dashboard", icon: LayoutDashboard },
      { label: "Sessions", href: "/tutor/sessions", icon: BookOpen },
      { label: "Earnings", href: "/tutor/earnings", icon: CreditCard },
      { label: "Messages", href: "/messages", icon: MessageSquare },
    ],
    investor: [
      { label: "Home", href: "/investor/dashboard", icon: LayoutDashboard },
      { label: "Sponsor", href: "/investor/universities", icon: GraduationCap },
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Feed", href: "/socialise", icon: Globe },
    ],
    admin: [
      { label: "Home", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Sessions", href: "/admin/sessions", icon: BookOpen },
      { label: "Transactions", href: "/admin/transactions", icon: CreditCard },
    ],
  };

  const currentNav = allNavItems[role] || allNavItems[user.role] || [];
  const bottomNav = mobileBottomItems[role] || mobileBottomItems[user.role] || [];
  // "More" drawer shows items NOT already in bottom bar
  const bottomHrefs = new Set(bottomNav.map((i) => i.href));
  const moreItems = currentNav.filter((i) => !bottomHrefs.has(i.href));

  const roleGradient: Record<string, string> = {
    student: "from-accent to-primary",
    tutor: "from-primary to-purple-600",
    investor: "from-yellow-500 to-orange-400",
    admin: "from-red-500 to-pink-500",
  };

  // Check if any "more" item is currently active
  const moreIsActive = moreItems.some(
    (i) => location === i.href || location.startsWith(i.href + "/")
  );

  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* ── DESKTOP SIDEBAR (unchanged) ── */}
      <aside className="hidden md:flex w-64 glass-panel border-r border-y-0 border-l-0 flex-col sticky top-0 h-screen">
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <Logo size={44} />
          <NotificationBell />
        </div>

        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <Link href="/profile"
            className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span>{user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className={`text-xs capitalize font-medium ${user.role === "investor" ? "text-yellow-400" : user.role === "admin" ? "text-red-400" : "text-accent"}`}>
                {user.role === "investor" ? "Sponsor" : user.role}
              </p>
            </div>
            <UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-white ml-auto shrink-0 transition-colors" />
          </Link>

          <nav className="space-y-0.5">
            {currentNav.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              const isFeed = item.href === "/socialise";
              return (
                <Link key={item.href} href={item.href}
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
      </aside>

      {/* ── MOBILE TOP HEADER ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-card/90 backdrop-blur-md sticky top-0 z-40">
        {/* Left: avatar + greeting */}
        <Link href="/profile" className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${roleGradient[user.role] ?? "from-primary to-accent"} flex items-center justify-center font-bold text-white shrink-0 overflow-hidden border-2 border-white/20`}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span>{user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-0.5">Welcome back</p>
            <p className="text-sm font-bold text-white leading-none">{firstName}</p>
          </div>
        </Link>

        {/* Right: notification bell */}
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>

      {/* ── MORE DRAWER BACKDROP ── */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MORE SLIDE-UP DRAWER ── */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-white/10 rounded-t-3xl pb-safe"
          >
            {/* Drawer handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-full bg-white/10 text-muted-foreground hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {moreItems.map((item) => {
                  const isActive = location === item.href || location.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                        isActive
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isActive ? "bg-primary/30" : "bg-white/5"}`}>
                        <item.icon className={`w-5 h-5 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${isActive ? "text-white" : "text-muted-foreground"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Logout button in drawer */}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-all">
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">Log Out</span>
              </button>
            </div>
            {/* Safe area spacer */}
            <div className="h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto relative min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        {/* pb-24 on mobile to clear the bottom nav bar */}
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto pb-24 md:pb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {title && <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-5">{title}</h1>}
            {children}
          </motion.div>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-stretch">
          {bottomNav.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all relative ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent"
                  />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? "text-accent" : ""}`} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-accent" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all relative ${
              moreIsActive ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {moreIsActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent"
              />
            )}
            <MoreHorizontal className="w-5 h-5" strokeWidth={moreIsActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>

        {/* iOS safe area spacer */}
        <div className="h-safe-area-inset-bottom" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </nav>
    </div>
  );
}

export default DashboardLayout;
