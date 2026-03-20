import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useListConversations, useListMessages, useSendMessage } from "@workspace/api-client-react";
import { Send, User } from "lucide-react";
import { format } from "date-fns";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { data: convData } = useListConversations();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const conversations = convData?.conversations || [];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] glass-panel rounded-3xl overflow-hidden flex border-white/10">
        
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/10 bg-black/20">
            <h2 className="text-xl font-bold text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No conversations yet.</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUserId(conv.userId)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-4 ${selectedUserId === conv.userId ? 'bg-white/5 border-l-2 border-l-accent' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {conv.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-semibold text-white truncate">{conv.userName}</h4>
                      <span className="text-xs text-muted-foreground">{format(new Date(conv.lastMessageAt), "MMM d")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {selectedUserId ? (
            <ChatArea otherUserId={selectedUserId} onBack={() => setSelectedUserId(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <User className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Select a conversation</p>
              <p>Choose someone from the list to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ChatArea({ otherUserId, onBack }: { otherUserId: number, onBack: () => void }) {
  const { user } = useAuthStore();
  const { data: msgData, refetch } = useListMessages({ otherUserId });
  const [content, setContent] = useState("");
  
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

  const messages = msgData?.messages || [];

  return (
    <>
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-4">
        <button onClick={onBack} className="md:hidden text-muted-foreground hover:text-white">
          ← Back
        </button>
        <h3 className="text-lg font-bold text-white">Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col-reverse">
        {messages.slice().reverse().map(msg => {
          const isMine = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl p-4 ${isMine ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-2 ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.createdAt), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <form onSubmit={handleSend} className="p-4 bg-black/40 border-t border-white/10 flex gap-3">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
        />
        <button 
          type="submit" 
          disabled={!content.trim() || sendMutation.isPending}
          className="bg-accent text-background p-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </>
  );
}
