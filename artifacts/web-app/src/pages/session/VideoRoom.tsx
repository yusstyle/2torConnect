import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import {
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff,
  Users, MessageSquare, Settings, Loader2, ArrowLeft,
  Wifi
} from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface VideoRoomProps {
  params: { id: string };
}

export default function VideoRoom({ params }: VideoRoomProps) {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const jitsiContainer = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [sessionTime, setSessionTime] = useState(0);

  const sessionId = params.id;
  const roomName = `2torconnect-session-${sessionId}`;

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setError("Could not load video library. Check your internet connection.");
      document.head.appendChild(script);
    };

    const initJitsi = () => {
      if (!jitsiContainer.current || apiRef.current) return;
      try {
        const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName,
          width: "100%",
          height: "100%",
          parentNode: jitsiContainer.current,
          userInfo: {
            displayName: user?.name || "Guest",
            email: user?.email || "",
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            toolbarButtons: [
              "microphone", "camera", "desktop", "fullscreen",
              "fodeviceselection", "hangup", "chat", "settings",
              "raisehand", "tileview", "download", "help",
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: "",
            SHOW_POWERED_BY: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            DEFAULT_BACKGROUND: "#0F0F1B",
            DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
            HIDE_INVITE_MORE_HEADER: false,
            MOBILE_APP_PROMO: false,
          },
        });

        apiRef.current = api;

        api.on("videoConferenceJoined", () => setLoading(false));
        api.on("participantJoined", () => setParticipantCount(c => c + 1));
        api.on("participantLeft", () => setParticipantCount(c => Math.max(1, c - 1)));
        api.on("audioMuteStatusChanged", ({ muted }: any) => setIsMuted(muted));
        api.on("videoMuteStatusChanged", ({ muted }: any) => setIsVideoOff(muted));
        api.on("readyToClose", () => handleLeave());
        api.on("errorOccurred", () => {
          setLoading(false);
          setError("A connection error occurred. Please try again.");
        });
      } catch (e) {
        setError("Failed to start video session. Please try again.");
        setLoading(false);
      }
    };

    loadJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, user]);

  const handleLeave = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    const role = user?.role;
    setLocation(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
  };

  const toggleMic = () => {
    apiRef.current?.executeCommand("toggleAudio");
  };

  const toggleVideo = () => {
    apiRef.current?.executeCommand("toggleVideo");
  };

  const shareScreen = () => {
    apiRef.current?.executeCommand("toggleShareScreen");
  };

  return (
    <div className="h-screen bg-[#0F0F1B] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur border-b border-white/10 z-20">
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

        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 text-white font-mono text-sm">
            <Wifi className="w-4 h-4 text-green-400" />
            {formatTime(sessionTime)}
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span>{participantCount}</span>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F0F1B] gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-2">Joining session…</p>
              <p className="text-muted-foreground text-sm mb-6">Setting up your camera and microphone</p>
              <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
            </div>
            <div className="glass-panel rounded-2xl px-6 py-4 max-w-sm text-center border border-white/10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-white">Room:</strong> {roomName}<br />
                Share this session ID <strong className="text-accent">#{sessionId}</strong> so both student and tutor can join the same room.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F0F1B] gap-6 p-8">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <VideoOff className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-2">Connection Failed</p>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div ref={jitsiContainer} className="w-full h-full" />
      </div>

      {/* Bottom quick-action bar (outside Jitsi) */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-3 bg-black/60 backdrop-blur border-t border-white/10 z-20">
        <button
          onClick={toggleMic}
          title={isMuted ? "Unmute" : "Mute"}
          className={`p-3 rounded-xl transition-all ${isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          title={isVideoOff ? "Start Video" : "Stop Video"}
          className={`p-3 rounded-xl transition-all ${isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={shareScreen}
          title="Share Screen"
          className="p-3 rounded-xl bg-white/10 text-white hover:bg-accent hover:text-background transition-all"
        >
          <Monitor className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={handleLeave}
          title="Leave Session"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/30"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">Leave</span>
        </button>
      </div>
    </div>
  );
}
