import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { useGetSession, useListMessages, useSendMessage } from "@workspace/api-client-react";
import {
  Video, PhoneOff, ArrowLeft, Wifi,
  ExternalLink, Copy, CheckCheck,
  Maximize2, Loader2, Youtube,
  MessageSquare, Send, X, Sparkles, PenTool
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import VoiceNoteRecorder from "@/components/VoiceNoteRecorder";
import VoiceNotePlayer from "@/components/VoiceNotePlayer";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";

interface VideoRoomProps {
  params: { id: string };
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.replace("/", "");
    }
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

export default function VideoRoom({ params }: VideoRoomProps) {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const [sessionTime, setSessionTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"video" | "whiteboard">("video");
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [lastReadCount, setLastReadCount] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const sessionId = params.id;
  const { data: session, isLoading } = useGetSession(Number(sessionId));

  const otherUserId = user?.id === session?.studentId ? session?.tutorId : session?.studentId;
  const otherName = user?.id === session?.studentId
    ? (session as any)?.tutorName || "Tutor"
    : (session as any)?.studentName || "Student";

  const { data: msgData, refetch: refetchMsgs } = useListMessages(
    otherUserId ? { otherUserId } : { otherUserId: 0 }
  );

  const messages = msgData?.messages || [];
  const unreadCount = !showChat && messages.length > lastReadCount ? messages.length - lastReadCount : 0;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (showChat) {
      setLastReadCount(messages.length);
    }
  }, [showChat, messages.length]);

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!otherUserId) return;
    const interval = setInterval(() => {
      refetchMsgs();
    }, 3000);
    return () => clearInterval(interval);
  }, [otherUserId, refetchMsgs]);

  useEffect(() => {
    if (showChat) {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, showChat]);

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        setChatInput("");
        refetchMsgs();
      }
    }
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !otherUserId) return;
    sendMutation.mutate({ data: { receiverId: otherUserId, content: chatInput } });
  };

  const handleSendVoiceNote = (audioData: string) => {
    if (!otherUserId) return;
    sendMutation.mutate({ data: { receiverId: otherUserId, content: `[VOICE_NOTE]:${audioData}` } });
  };

  const handleLeave = () => {
    const role = user?.role;
    setLocation(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
  };

  const liveUrl = (session as any)?.liveUrl ?? "";
  const youtubeId = liveUrl ? extractYoutubeId(liveUrl) : null;

  const roomName = `2torconnect-session-${sessionId}`;
  const jitsiIframeUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.MOBILE_APP_PROMO=false&interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true`;
  const youtubeEmbedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`
    : null;

  const copyLink = () => {
    const link = youtubeId ? `https://youtu.be/${youtubeId}` : `https://meet.jit.si/${roomName}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0F0F1B] flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
          <Video className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xl mb-2">Loading session…</p>
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        </div>
      </div>
    );
  }

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
            <p className="text-white font-bold text-sm leading-tight">
              {(session as any)?.subject ?? `Session #${sessionId}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {otherName ? `With ${otherName}` : "2torConnect Live"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher: Video vs Whiteboard */}
          <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView("video")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeView === "video" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
              }`}
              title="Video Call View"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Video</span>
            </button>
            <button
              onClick={() => setActiveView("whiteboard")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeView === "whiteboard" ? "bg-accent text-background font-bold shadow-sm" : "text-muted-foreground hover:text-white"
              }`}
              title="2torBoard Whiteboard"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Whiteboard</span>
            </button>
          </div>

          {youtubeId && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/30">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400">Live Stream</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>

          <div className="flex items-center gap-1.5 text-white font-mono text-xs sm:text-sm">
            <Wifi className="w-4 h-4 text-green-400" />
            {formatTime(sessionTime)}
          </div>

          {/* Toggle In-Call Chat & Voice Notes Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              showChat
                ? "bg-accent text-background font-bold shadow-accent/20"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Chat & Voice Notes"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Voice & Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-background text-[10px] font-black flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main interactive area: Video Frame + Side Chat Drawer */}
      <div className="flex-1 relative overflow-hidden flex flex-row">

        {/* Main Workspace (Video stream or Whiteboard) */}
        <div className="flex-1 relative overflow-hidden flex flex-col h-full bg-black">
          {/* Whiteboard view */}
          <div className={`w-full h-full p-2 sm:p-3 ${activeView === "whiteboard" ? "flex flex-col" : "hidden"}`}>
            <WhiteboardCanvas initialBackground="grid" />
          </div>

          {/* Video call view (kept alive in DOM so audio never disconnects) */}
          <div className={`w-full h-full flex flex-col relative ${activeView === "video" ? "flex" : "hidden"}`}>
            {/* Loading overlay */}
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F0F1B] gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl mb-2">
                    {youtubeId ? "Starting live stream…" : "Starting video room…"}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">
                    {youtubeId ? "Your tutor's live session is loading" : "Allow camera and microphone when prompted"}
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                </div>
              </div>
            )}

            {youtubeEmbedUrl ? (
              <iframe
                key={youtubeEmbedUrl}
                src={youtubeEmbedUrl}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="flex-1 w-full border-0"
                style={{ minHeight: 0 }}
                title="2torConnect Live Session"
                onLoad={() => setIframeLoaded(true)}
              />
            ) : (
              <iframe
                src={jitsiIframeUrl}
                allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-write"
                allowFullScreen
                className="flex-1 w-full border-0"
                style={{ minHeight: 0 }}
                title="2torConnect Video Session"
                onLoad={() => setIframeLoaded(true)}
              />
            )}
          </div>
        </div>

        {/* In-Call Chat & Voice Notes Drawer */}
        {showChat && (
          <aside className="w-full sm:w-[380px] md:w-[420px] bg-[#101020]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col absolute sm:relative inset-y-0 right-0 z-30 shadow-2xl transition-all animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                  {otherName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                    Live Chat & Audio
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground">With {otherName}</p>
                </div>
              </div>

              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-call Voice Note info hint */}
            <div className="px-3 py-2 bg-accent/10 border-b border-accent/20 flex items-center gap-2 text-xs text-accent">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <p className="leading-tight">
                Send voice notes or text questions without interrupting live audio!
              </p>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 opacity-30 text-accent" />
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">No in-call messages yet</p>
                  <p className="text-xs max-w-[200px]">
                    Record a voice note or type a question for {otherName}.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId === user?.id;
                  const showDate =
                    i === 0 ||
                    new Date(msg.createdAt).toDateString() !==
                      new Date(messages[i - 1].createdAt).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-2">
                          <span className="text-[10px] text-muted-foreground bg-white/5 px-2.5 py-0.5 rounded-full">
                            {isToday(new Date(msg.createdAt))
                              ? "Today"
                              : isYesterday(new Date(msg.createdAt))
                              ? "Yesterday"
                              : format(new Date(msg.createdAt), "MMM d")}
                          </span>
                        </div>
                      )}

                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        {!isMine && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-1.5 mt-auto">
                            {otherName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-md ${
                            isMine
                              ? "bg-gradient-to-br from-primary to-primary/80 text-white rounded-tr-sm"
                              : "bg-white/10 text-white rounded-tl-sm border border-white/5"
                          }`}
                        >
                          {msg.content.startsWith("[VOICE_NOTE]:") ? (
                            <VoiceNotePlayer
                              audioSrc={msg.content.replace("[VOICE_NOTE]:", "")}
                              isMine={isMine}
                            />
                          ) : (
                            <p className="leading-relaxed break-words">{msg.content}</p>
                          )}
                          <p
                            className={`text-[9px] mt-1 ${
                              isMine ? "text-white/60 text-right" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatScrollRef} />
            </div>

            {/* Bottom In-Call Input with Voice Note Recorder & Text Field */}
            <div className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2 shrink-0">
              <VoiceNoteRecorder onSendVoiceNote={handleSendVoiceNote} />

              <form onSubmit={handleSendChat} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${otherName}…`}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendMutation.isPending}
                  className="bg-accent text-background p-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-black/70 backdrop-blur border-t border-white/10 z-20 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={copyLink}
            title="Copy session link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-xs"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat toggle button in bottom bar */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              showChat
                ? "bg-accent text-background shadow-lg shadow-accent/20"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
              )}
            </div>
            <span>{showChat ? "Hide Chat" : "Chat & Voice"}</span>
          </button>

          {youtubeId && (
            <button
              onClick={() => window.open(`https://youtu.be/${youtubeId}`, "_blank", "noopener,noreferrer")}
              title="Open in new tab"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-medium"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Full Screen</span>
            </button>
          )}

          {!youtubeId && (
            <button
              onClick={() => window.open(jitsiIframeUrl, "_blank", "noopener,noreferrer,width=1280,height=720")}
              title="Open in new window"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Pop Out</span>
            </button>
          )}

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
