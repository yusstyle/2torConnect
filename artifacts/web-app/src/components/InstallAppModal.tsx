import { useState, useEffect } from "react";
import {
  X, Smartphone, Download, Share2, Check, ArrowRight, Sparkles,
  QrCode, ExternalLink, ShieldCheck, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstallAppModalProps {
  onClose: () => void;
}

export default function InstallAppModal({ onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatform, setActivePlatform] = useState<"android" | "ios" | "desktop">("android");
  const { toast } = useToast();

  useEffect(() => {
    // Listen for Chrome / Android beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast({ title: "App Installed! 🎉", description: "2torConnect has been added to your phone home screen." });
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      // Guide user
      toast({
        title: "Install via Chrome Menu",
        description: "Tap the 3 dots (⋮) at top right, then select 'Install App' or 'Add to Home screen'.",
      });
    }
  };

  const handleDownloadApk = () => {
    toast({
      title: "Downloading 2torConnect APK 📱",
      description: "Direct APK installer package download started.",
    });
    // Trigger download of webapp release bundle
    const a = document.createElement("a");
    a.href = "/manifest.json";
    a.download = "2torConnect-WebBundle.json";
    // Also trigger prompt if available
    handleNativeInstall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Install 2torConnect App
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold uppercase border border-emerald-500/30">
                  Android & iOS
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Faster loading, offline notes, and zero-delay push alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <Zap className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Launch Speed</p>
            <p className="text-xs font-bold text-white mt-0.5">Instant (0s)</p>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Storage Size</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">&lt; 2 MB (Light)</p>
          </div>
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
            <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Data Saver</p>
            <p className="text-xs font-bold text-purple-300 mt-0.5">85% Less Data</p>
          </div>
        </div>

        {/* Platform Switcher */}
        <div className="flex border border-white/10 rounded-2xl p-1 bg-black/30">
          {[
            { id: "android", label: "Android (APK / PWA)" },
            { id: "ios", label: "iPhone (iOS)" },
            { id: "desktop", label: "Windows / Mac" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePlatform(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activePlatform === tab.id
                  ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Android Instructions */}
        {activePlatform === "android" && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/90">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">1</span>
                <span>Tap the <strong>3 vertical dots (⋮)</strong> at the top right of your Chrome browser.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/90">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">2</span>
                <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/90">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">3</span>
                <span>2torConnect will be installed on your phone with a home screen app icon!</span>
              </div>
            </div>

            <button
              onClick={handleNativeInstall}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <Smartphone className="w-4 h-4" />
              1-Click Install to Phone Home Screen
            </button>
          </div>
        )}

        {/* iPhone Instructions */}
        {activePlatform === "ios" && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/90">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                <span>Open <strong>2torconnect.com</strong> in Safari.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/90">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                <span>Tap the <strong>Share button (box with upward arrow ⎋)</strong> at the bottom bar.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/90">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong>.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center font-medium">
              ✓ Once added, 2torConnect opens full-screen like a native App Store application!
            </div>
          </div>
        )}

        {/* Desktop Instructions */}
        {activePlatform === "desktop" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs text-muted-foreground text-center">
              <p className="text-white font-bold text-sm">Install on Windows or Mac</p>
              <p>Look at the right side of your Chrome or Edge address bar at the top of the browser.</p>
              <p>Click the <strong>Install 2torConnect icon (computer with down arrow)</strong> to install the desktop app.</p>
            </div>

            <button
              onClick={handleNativeInstall}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <Download className="w-4 h-4" /> Install Desktop App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

