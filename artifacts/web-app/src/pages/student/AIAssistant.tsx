import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Bot, Send, Trash2, Loader2, User, Sparkles, BookOpen, Code2,
  Calculator, PenLine, RotateCcw, Image as ImageIcon, ExternalLink,
  Download, Maximize2, X, Camera, ImagePlus, UserCheck, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  image?: string;
}

const QUICK_PROMPTS = [
  { icon: Camera, label: "Snap & Solve photo homework", prompt: "Please inspect and solve this problem step-by-step with clear working and explanations: " },
  { icon: Calculator, label: "Solve a maths problem", prompt: "Help me solve this maths problem step by step: " },
  { icon: ImageIcon, label: "Draw an educational diagram", prompt: "Draw a detailed educational diagram showing: " },
  { icon: BookOpen, label: "Summarise an exam topic", prompt: "Give me a high-yield exam summary of: " },
  { icon: Code2, label: "Explain code", prompt: "Explain this code to me: " },
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function ChatImage({ src, alt }: { src?: string; alt?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const isCompleteUrl = Boolean(
    src &&
    (src.startsWith("http://") || src.startsWith("https://")) &&
    (src.includes("?") || src.length > 40)
  );

  useEffect(() => {
    if (isCompleteUrl) {
      setError(false);
      setLoading(true);
    }
  }, [src, isCompleteUrl, retryKey]);

  if (!isCompleteUrl) {
    return (
      <div className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-lg h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse bg-white/5">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="text-xs font-medium">Generating high-definition illustration...</span>
      </div>
    );
  }

  // Ensure high-quality FLUX model is used
  let enhancedSrc = src || "";
  if (enhancedSrc.includes("image.pollinations.ai") && !enhancedSrc.includes("model=")) {
    enhancedSrc += enhancedSrc.includes("?") ? "&model=flux&nologo=true" : "?model=flux&nologo=true";
  }

  const handleDownloadCleanImage = (imageSrc: string, filename: string) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const cropBottom = 42;
          const targetHeight = Math.max(img.naturalHeight - cropBottom, 100);
          canvas.width = img.naturalWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.naturalWidth, targetHeight, 0, 0, img.naturalWidth, targetHeight);
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/jpeg", 0.95);
            a.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, "_") || "2torconnect-image"}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
          }
        } catch (e) {
          console.warn("Canvas crop fallback:", e);
        }
        window.open(imageSrc, "_blank");
      };
      img.onerror = () => {
        window.open(imageSrc, "_blank");
      };
      img.src = imageSrc;
    } catch {
      window.open(imageSrc, "_blank");
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl group">
      <div className="relative overflow-hidden flex items-center justify-center min-h-[220px] bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm z-10 text-xs text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span>Loading illustration...</span>
          </div>
        )}
        <img
          key={retryKey}
          src={enhancedSrc}
          alt={alt || "Educational diagram"}
          className={`w-full max-h-[460px] object-contain transition-all duration-300 ${loading ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
          style={{ clipPath: "inset(0 0 42px 0)", marginBottom: "-42px" }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </div>

      {error && (
        <div className="h-32 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-white/5 p-4 text-center">
          <span>Failed to load image</span>
          <button
            onClick={() => {
              setError(false);
              setLoading(true);
              setRetryKey(k => k + 1);
            }}
            className="px-3 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-medium text-xs transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Retry Generation
          </button>
        </div>
      )}
      {alt && !error && !loading && (
        <div className="flex items-center justify-between text-xs text-muted-foreground py-2.5 px-3.5 bg-white/5 border-t border-white/5">
          <span className="font-medium text-white/80 truncate mr-2">{alt}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsZoomed(true)}
              className="text-white/70 hover:text-white flex items-center gap-1 font-medium hover:bg-white/10 px-2 py-1 rounded-lg transition-colors text-xs"
              title="Expand view"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
            </button>
            <button
              onClick={() => handleDownloadCleanImage(enhancedSrc, alt || "2torconnect-image")}
              className="text-white/90 hover:text-white flex items-center gap-1 font-medium hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors bg-white/5 border border-white/10 text-xs"
              title="Download watermark-free image"
            >
              <Download className="w-3.5 h-3.5 text-accent" /> Save Clean Image
            </button>
          </div>
        </div>
      )}

      {/* Watermark-Free Lightbox Modal */}
      <AnimatePresence>
        {isZoomed && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-black" style={{ marginBottom: "-42px" }}>
                <img
                  src={enhancedSrc}
                  alt={alt || "High Definition Image"}
                  className="max-h-[75vh] w-auto object-contain rounded-2xl"
                  style={{ clipPath: "inset(0 0 42px 0)" }}
                />
                <div className="absolute bottom-12 right-4 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 shadow-lg flex items-center gap-1.5 pointer-events-none">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> 2torConnect AI
                </div>
              </div>
              <div className="mt-14 flex items-center gap-3">
                <button
                  onClick={() => handleDownloadCleanImage(enhancedSrc, alt || "2torconnect-image")}
                  className="px-4 py-2 rounded-xl bg-accent text-white font-medium text-xs flex items-center gap-2 hover:bg-accent/90 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" /> Download Clean HD
                </button>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser
          ? "bg-gradient-to-br from-primary to-accent"
          : "bg-gradient-to-br from-accent/20 to-primary/20 border border-white/10"
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-primary to-accent text-white rounded-tr-sm"
          : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm"
      }`}>
        {isUser ? (
          <div className="space-y-2">
            {msg.image && (
              <div className="rounded-xl overflow-hidden max-w-[260px] border border-white/20">
                <img src={msg.image} alt="Uploaded homework" className="w-full object-cover max-h-48" />
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-foreground prose-p:leading-relaxed
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-accent prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
              prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground
              prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground">
              <ReactMarkdown
                components={{
                  img: ({ node, ...props }) => <ChatImage src={props.src} alt={props.alt} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>

            {/* Tutor connection banner */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Need a human tutor to walk you through this?</span>
              <Link
                href="/student/find-tutor"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold transition-all"
              >
                <UserCheck className="w-3.5 h-3.5" /> Book 1-on-1 Tutor
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AIAssistantPage() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && !selectedImage) || streaming) return;

    const currentImage = selectedImage;
    const userMsg: Message = {
      role: "user",
      content: content || "Please analyze and solve the question in this photo step by step:",
      id: Date.now().toString(),
      image: currentImage || undefined,
    };
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { role: "assistant", content: "", id: assistantId }]);

    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMsg.content,
          history,
          image: currentImage || undefined,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.content) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + evt.content } : m
                )
              );
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I ran into an error. Please try again." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (streaming) return;
    setMessages([]);
  };

  const hasMessages = messages.length > 0;

  return (
    <DashboardLayout role="student" title="AI Study Assistant">
      <div className="flex flex-col h-[calc(100dvh-300px)] md:h-[calc(100vh-80px)] max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/30 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">2torAssist</h2>
              <p className="text-muted-foreground text-xs">Snap & Solve Homework · FLUX Diagrams · GPT-4o</p>
            </div>
          </div>
          {hasMessages && (
            <button
              onClick={clearChat}
              disabled={streaming}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New chat
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {!hasMessages ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center px-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-primary/20 border border-white/10 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Hi! I'm 2torAssist</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md">
                Your AI-powered university study partner. Upload a photo of any difficult homework problem, ask for step-by-step calculus working, or generate educational diagrams.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label.includes("Snap")) {
                        fileInputRef.current?.click();
                      } else {
                        setInput(prompt);
                      }
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-2xl glass-panel border border-white/10 hover:border-accent/30 hover:bg-accent/5 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-all">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {streaming && messages[messages.length - 1]?.content === "" && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 glass-panel rounded-2xl border border-white/10 p-3 space-y-2">
          {/* Selected photo preview thumbnail */}
          {selectedImage && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-accent/30 w-fit">
              <img src={selectedImage} alt="Homework preview" className="w-10 h-10 object-cover rounded-lg" />
              <div className="text-xs">
                <span className="text-white font-medium block">Photo attached</span>
                <span className="text-accent text-[10px]">Ready to solve</span>
              </div>
              <button
                onClick={removeSelectedImage}
                className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Photo / Camera button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={streaming}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-accent border border-white/10 flex items-center justify-center shrink-0 transition-colors"
              title="Upload homework photo (Snap & Solve)"
            >
              <Camera className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage ? "Add instructions or question details..." : "Ask anything, or snap a photo of your homework..."}
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent text-white placeholder:text-muted-foreground text-sm resize-none outline-none leading-relaxed py-1 max-h-32 overflow-y-auto disabled:opacity-50"
              style={{ minHeight: "24px" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !selectedImage) || streaming}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground px-1 flex items-center justify-between">
            <span>Press Enter to send · Click camera to upload problem photo</span>
            <span className="text-accent font-semibold hidden sm:inline">2torAssist Snap & Solve</span>
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
