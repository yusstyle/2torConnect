import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { Bot, Send, Trash2, Loader2, User, Sparkles, BookOpen, Code2, Calculator, PenLine, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

const QUICK_PROMPTS = [
  { icon: Calculator, label: "Solve a maths problem", prompt: "Help me solve this maths problem step by step: " },
  { icon: BookOpen, label: "Summarise a topic", prompt: "Give me a clear summary of: " },
  { icon: PenLine, label: "Write an essay outline", prompt: "Help me create an essay outline for: " },
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
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-primary to-accent text-white rounded-tr-sm"
          : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm"
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-foreground prose-p:leading-relaxed
            prose-strong:text-white prose-strong:font-semibold
            prose-code:text-accent prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
            prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground
            prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
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
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content, id: Date.now().toString() };
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput("");
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
        body: JSON.stringify({ message: content, history }),
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
              <p className="text-muted-foreground text-xs">Powered by GPT-5.4 · Always here to help</p>
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
              <p className="text-muted-foreground text-sm mb-8 max-w-md">
                Your AI-powered study partner. Ask me anything — from solving equations to writing essays, explaining code, or planning your revision schedule.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => setInput(prompt)}
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
        <div className="shrink-0 glass-panel rounded-2xl border border-white/10 p-3">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything — maths, essays, code, study plans..."
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
              disabled={!input.trim() || streaming}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 px-1">
            Press Enter to send · Shift+Enter for new line · Powered by Replit AI (charges to your credits)
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
