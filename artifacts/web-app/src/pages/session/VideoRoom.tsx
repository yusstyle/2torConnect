import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import {
  Video, PhoneOff, ArrowLeft, Wifi,
  Users, ExternalLink, Copy, CheckCheck,
  Maximize2, Loader2
} from "lucide-react";

interface VideoRoomProps {
  params: { id: string };
}

export default function VideoRoom({ params }: VideoRoomProps) {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const [sessionTime, setSessionTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const sessionId = params.id;
  const roomName = `2torconnect-session-${sessionId}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;
  const jitsiIframeUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.MOBILE_APP_PROMO=false&interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true`;

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "00")}`;
  };

  const handleLeave = () => {
    const role = user?.role;
    setLocation(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(jitsiUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openExternal = () => {
    window.open(jitsiUrl, "_blank", "noopener,noreferrer");
  };

  const openFullscreen = () => {
    window.open(jitsiIframeUrl, "_blank", "noopener,noreferrer,width=1280,height=720");
  };

  return (
    <div className="h-screen bg-[#0F0F1B] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-px bg-white/10" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Session #{sessionId}</p>
            <p className="text-xs text-muted-foreground">2torConnect Live</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-white font-mono text-sm">
            <Wifi className="w-4 h-4 text-green-400" />
            {formatTime(sessionTime)}
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">

        {/* Loading overlay */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F0F1B] gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-2">Starting video room…</p>
              <p className="text-muted-foreground text-sm mb-4">Allow camera and microphone when prompted</p>
              <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
            </div>
          </div>
        )}

        {/* Jitsi iframe — direct embed, most compatible */}
        <iframe
          src={jitsiIframeUrl}
          allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-write"
          allowFullScreen
          className="flex-1 w-full border-0"
          style={{ minHeight: 0 }}
          title="2torConnect Video Session"
          onLoad={() => setIframeLoaded(true)}
          onError={() => { setIframeError(true); setIframeLoaded(true); }}
        />
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-black/70 backdrop-blur border-t border-white/10 z-20 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-white/60 truncate max-w-[200px] hidden sm:block">{roomName}</span>
          <button
            onClick={copyRoom}
            title="Copy room link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-xs"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openFullscreen}
            title="Open in new window (full screen)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-medium"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Pop Out</span>
          </button>

          <button
            onClick={openExternal}
            title="Open in Jitsi Meet app"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 transition-all text-xs font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open in Browser</span>
          </button>

          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/30 text-sm"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
