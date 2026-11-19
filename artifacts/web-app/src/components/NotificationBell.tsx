import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import { Bell, X, CheckCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface Notif {
  id: number; type: string; title: string; message: string; link?: string;
  isRead: boolean; createdAt: string;
}

function decodeVapidKey(key: string): Uint8Array {
  const padded = key + "=".repeat((4 - key.length % 4) % 4);
  const decoded = window.atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

const TYPE_COLORS: Record<string, string> = {
  review: "bg-yellow-500/20 text-yellow-400",
  assignment: "bg-blue-500/20 text-blue-400",
  group: "bg-purple-500/20 text-purple-400",
  referral: "bg-green-500/20 text-green-400",
  session: "bg-accent/20 text-accent",
  default: "bg-white/10 text-muted-foreground",
};

export default function NotificationBell() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushPublicKey, setPushPublicKey] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
  const unread = notifs.filter(n => !n.isRead).length;

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/notifications`, { headers });
      const d = await r.json();
      if (Array.isArray(d)) setNotifs(d);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 15000); // poll every 15s
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    let active = true;
    const syncSubscription = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!token || !supported) { setPushAvailable(false); setPushEnabled(false); return; }
      try {
        const configResponse = await fetch(`${API}/notifications/push-config`);
        const config = await configResponse.json();
        if (!active) return;
        setPushAvailable(Boolean(config.enabled && config.publicKey));
        setPushPublicKey(config.publicKey || "");
        if (!config.enabled || !config.publicKey) { setPushEnabled(false); return; }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!active) return;
        setPushEnabled(Boolean(subscription));
        if (subscription) {
          await fetch(`${API}/notifications/push-subscriptions`, {
            method: "POST", headers,
            body: JSON.stringify(subscription),
          });
        }
      } catch { if (active) setPushAvailable(false); }
    };
    syncSubscription();
    return () => { active = false; };
  }, [token]);

  const togglePush = async () => {
    if (!token) return;
    setPushLoading(true);
    try {
      if (!pushEnabled && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Allow notifications for 2torConnect in your browser settings to enable alerts.");
      }
      const configResponse = await fetch(`${API}/notifications/push-config`);
      const config = await configResponse.json();
      if (!config.enabled || !config.publicKey) throw new Error("Desktop alerts are not configured yet.");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing && pushEnabled) {
        await fetch(`${API}/notifications/push-subscriptions`, { method: "DELETE", headers, body: JSON.stringify({ endpoint: existing.endpoint }) });
        await existing.unsubscribe();
        setPushEnabled(false);
        toast({ title: "Desktop alerts turned off" });
      } else {
        const subscription = existing || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(pushPublicKey || config.publicKey) as BufferSource,
        });
        const response = await fetch(`${API}/notifications/push-subscriptions`, { method: "POST", headers, body: JSON.stringify(subscription) });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Could not enable desktop alerts.");
        }
        setPushAvailable(true);
        setPushEnabled(true);
        toast({ title: "Desktop alerts enabled", description: "New messages and 2torConnect notifications can now alert you when the site is closed." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Notification setup failed", description: err.message || "Could not set up desktop alerts." });
    } finally { setPushLoading(false); }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await fetch(`${API}/notifications/${id}/read`, { method: "PATCH", headers });
  };

  const markAll = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    await fetch(`${API}/notifications/read-all`, { method: "PATCH", headers });
  };

  const clickNotif = (n: Notif) => {
    markRead(n.id);
    if (n.link) setLocation(n.link);
    setOpen(false);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white text-[9px] font-bold leading-none px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed sm:absolute top-16 sm:top-12 left-4 right-4 sm:left-auto sm:right-0 w-auto sm:w-80 bg-[#0d0e16]/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                <span className="text-white font-bold text-sm">Notifications</span>
                {unread > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-bold">{unread}</span>}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <div className="px-4 py-2 border-b border-white/5">
                <button onClick={togglePush} disabled={pushLoading || !pushAvailable} className="w-full text-left text-xs text-accent hover:text-white disabled:text-muted-foreground disabled:cursor-not-allowed">
                  {pushLoading ? "Setting up alerts…" : pushEnabled ? "Turn off desktop alerts" : pushAvailable ? "Enable desktop alerts" : "Desktop alerts unavailable"}
                </button>
                {!pushAvailable && <p className="text-[10px] text-muted-foreground mt-1">Background alerts need browser permission and server push setup.</p>}
              </div>
              {notifs.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">No notifications yet</p>
                </div>
              ) : (
                notifs.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    onClick={() => clickNotif(n)}
                    className={`flex gap-3 p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? "bg-white/3" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${TYPE_COLORS[n.type] ?? TYPE_COLORS.default}`}>
                      {n.type.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-sm font-semibold leading-tight ${n.isRead ? "text-white/70" : "text-white"}`}>{n.title}</p>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{format(new Date(n.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
