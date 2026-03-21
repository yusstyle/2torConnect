import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useListConversations, useListMessages, useSendMessage, useListTutors } from "@workspace/api-client-react";
import { Send, User, MessageSquare, Search, ArrowLeft, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [location] = useLocation();

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const initWith = params.get("with") ? Number(params.get("with")) : null;
  const initName = params.get("name") ? decodeURIComponent(params.get("name")!) : null;

  const [selectedUserId, setSelectedUserId] = useState<number | null>(initWith);
  const [selectedName, setSelectedName] = useState<string | null>(initName);
  const [showNewChat, setShowNewChat] = useState(false);

  const { data: convData, refetch: refetchConvs } = useListConversations();
  const conversations = convData?.conversations || [];

  useEffect(() => {
    const interval = setInterval(() => { refetchConvs(); }, 5000);
    return () => clearInterval(interval);
  }, [refetchConvs]);

  const openChat = (userId: number, name: string) => {
    setSelectedUserId(userId);
    setSelectedName(name);
    setShowNewChat(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <DashboardLayout title="Messages" role={user?.role as any}>
      <div className="h-[calc(100vh-8rem)] glass-panel rounded-3xl overflow-hidden flex border border-white/10">

        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-white/10 flex flex-col shrink-0 ${selectedUserId || showNewChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Messages</h2>
            {user?.role === "student" && (
              <button
                onClick={() => setShowNewChat(true)}
                title="Start a new chat"
                className="p-2 rounded-xl bg-accent/20 hover:bg-accent text-accent hover:text-background transition-all"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <div>
                  <p className="font-medium text-white mb-1">No conversations yet</p>
                  {user?.role === "student" && (
                    <p className="text-sm">Find a tutor and tap <strong>Chat</strong> to get started</p>
                  )}
                </div>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => openChat(conv.userId, conv.userName)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 ${selectedUserId === conv.userId ? 'bg-white/5 border-l-2 border-l-accent' : ''}`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 text-sm">
                    {conv.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-white truncate text-sm">{conv.userName}</h4>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatMsgTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main area */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedUserId && !showNewChat ? 'hidden md:flex' : 'flex'}`}>
          {showNewChat ? (
            <NewChatPanel
              onSelect={openChat}
              onClose={() => setShowNewChat(false)}
            />
          ) : selectedUserId ? (
            <ChatArea
              otherUserId={selectedUserId}
              otherName={selectedName || "User"}
              onBack={() => { setSelectedUserId(null); setSelectedName(null); }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 opacity-40" />
              </div>
              <p className="text-xl font-semibold text-white mb-2">Select a conversation</p>
              {user?.role === "student" ? (
                <p>Pick someone from the list, or tap <span className="text-accent font-semibold">+</span> to start a new chat with a tutor.</p>
              ) : (
                <p>Pick a conversation from the list to start chatting.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function NewChatPanel({ onSelect, onClose }: { onSelect: (id: number, name: string) => void, onClose: () => void }) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListTutors({ search, limit: 30 });
  const tutors = data?.tutors || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-white flex-1">New Message</h3>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-accent transition-all"
            placeholder="Search tutors by name or subject..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Searching...</div>
        ) : tutors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No tutors found</div>
        ) : (
          tutors.map(tutor => (
            <button
              key={tutor.id}
              onClick={() => onSelect(tutor.userId, tutor.name)}
              className="w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 text-sm">
                {tutor.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{tutor.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {tutor.university || "Tutor"}{tutor.subjects?.length ? ` · ${tutor.subjects.slice(0, 2).join(", ")}` : ""}
                </p>
              </div>
              <MessageSquare className="w-4 h-4 text-accent shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ChatArea({ otherUserId, otherName, onBack }: { otherUserId: number, otherName: string, onBack: () => void }) {
  const { user } = useAuthStore();
  const { data: msgData, refetch } = useListMessages({ otherUserId });
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => { refetch(); }, 3000);
    return () => clearInterval(interval);
  }, [refetch, otherUserId]);

  const messages = msgData?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        setContent("");
        refetch();
      }
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMutation.mutate({ data: { receiverId: otherUserId, content } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="md:hidden text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
          {otherName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-white text-sm leading-tight">{otherName}</h3>
          <p className="text-xs text-green-400">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center py-16">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-white mb-1">Start the conversation</p>
            <p className="text-sm">Say hi to {otherName}!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.senderId === user?.id;
            const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center my-2">
                    <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                      {isToday(new Date(msg.createdAt)) ? "Today" : isYesterday(new Date(msg.createdAt)) ? "Yesterday" : format(new Date(msg.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-auto">
                      {otherName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[72%] rounded-2xl px-4 py-3 ${isMine ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${isMine ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-black/40 border-t border-white/10 flex gap-2 shrink-0">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherName}…`}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-all"
        />
        <button
          type="submit"
          disabled={!content.trim() || sendMutation.isPending}
          className="bg-accent text-background p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </>
  );
}
