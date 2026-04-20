import { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Image, Video, Loader2,
  Send, X, Feather, Film, Radio, MoreHorizontal, Trash2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type PostType = "tweet" | "post" | "reel" | "video";

interface Post {
  id: number; userId: number; content: string | null; mediaUrl: string | null;
  mediaType: string | null; type: PostType; likeCount: number; commentCount: number;
  createdAt: string; authorName: string; authorRole: string; authorAvatarUrl?: string | null; liked: boolean;
}

interface Comment {
  id: number; content: string; createdAt: string; authorName: string;
}

const POST_TYPES: { type: PostType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "tweet", label: "Tweet", icon: Feather, color: "text-accent" },
  { type: "post", label: "Post", icon: Image, color: "text-primary" },
  { type: "reel", label: "Reel", icon: Film, color: "text-pink-400" },
  { type: "video", label: "Video", icon: Video, color: "text-green-400" },
];

const ROLE_COLORS: Record<string, string> = {
  student: "bg-accent/20 text-accent",
  tutor: "bg-primary/20 text-primary",
  investor: "bg-yellow-500/20 text-yellow-400",
  admin: "bg-red-500/20 text-red-400",
};

function PostCard({ post, currentUserId, onLike, onDelete, onComment }: {
  post: Post; currentUserId: number;
  onLike: (id: number) => void; onDelete: (id: number) => void; onComment: (id: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = post.userId === currentUserId;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-5 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
          {post.authorAvatarUrl
            ? <img src={post.authorAvatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
            : <span>{post.authorName.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-sm">{post.authorName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[post.authorRole] ?? "bg-white/10 text-white/60"}`}>{post.authorRole}</span>
            <span className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            {post.type !== "tweet" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium capitalize">{post.type}</span>
            )}
          </div>
        </div>
        {isOwn && (
          <div className="relative">
            <button onClick={() => setShowMenu(s => !s)} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 z-20 glass-panel rounded-xl p-1 min-w-[120px] shadow-xl border border-white/10">
                <button onClick={() => { onDelete(post.id); setShowMenu(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 w-full text-sm font-medium transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.content && <p className="text-white/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>}

      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden mb-3 bg-black/40">
          {post.mediaType?.startsWith("video") || post.type === "reel" || post.type === "video"
            ? <video src={post.mediaUrl} controls className="w-full max-h-80 object-contain" />
            : <img src={post.mediaUrl} alt="Post media" className="w-full max-h-80 object-cover" />}
        </div>
      )}

      <div className="flex items-center gap-5 pt-2 border-t border-white/5">
        <button onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 ${post.liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}>
          <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
          <span>{post.likeCount}</span>
        </button>
        <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent transition-all">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-all ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function CommentDrawer({ postId, onClose }: { postId: number; onClose: () => void }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const token = useAuthStore.getState().token;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${BASE}/api/social/posts/${postId}/comments`, { headers })
      .then(r => r.json()).then(d => setComments(d.comments ?? [])).finally(() => setLoading(false));
  }, [postId]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/social/posts/${postId}/comments`, { method: "POST", headers, body: JSON.stringify({ content: text }) });
      const c = await res.json();
      setComments(prev => [c, ...prev]);
      setText("");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-5 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Comments</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && submit()}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent text-sm"
            placeholder="Write a comment..." />
          <button onClick={submit} disabled={submitting || !text.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="overflow-y-auto space-y-3 flex-1">
          {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
            : comments.length === 0
              ? <p className="text-muted-foreground text-center py-6 text-sm">No comments yet. Be the first!</p>
              : comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {c.authorName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-xs">{c.authorName}</span>
                      <span className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-white/80 text-sm mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function SocialisePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("tweet");
  const [activeFilter, setActiveFilter] = useState<PostType | "all">("all");
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const token = useAuthStore.getState().token;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFeed = useCallback(async (type?: string) => {
    setLoading(true);
    try {
      const url = type && type !== "all" ? `${BASE}/api/social/feed?type=${type}&limit=30` : `${BASE}/api/social/feed?limit=30`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeed(activeFilter === "all" ? undefined : activeFilter); }, [activeFilter]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = ev => setMediaPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (file.type.startsWith("video")) setPostType("video");
    else if (postType === "tweet") setPostType("post");
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) { toast({ variant: "destructive", title: "Write something first!" }); return; }
    setCreating(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaFile) {
        const fd = new FormData();
        fd.append("file", mediaFile);
        const uploadRes = await fetch(`${BASE}/api/social/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (uploadRes.ok) { const d = await uploadRes.json(); mediaUrl = d.url; mediaType = mediaFile.type; }
      }

      const res = await fetch(`${BASE}/api/social/posts`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() || null, mediaUrl, mediaType, type: postType }),
      });
      const newPost = await res.json();
      if (!res.ok) throw new Error(newPost.error);
      setPosts(prev => [newPost, ...prev]);
      setContent(""); setMediaFile(null); setMediaPreview(null);
      toast({ title: "Posted!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to post", description: err.message });
    } finally { setCreating(false); }
  };

  const handleLike = async (postId: number) => {
    const res = await fetch(`${BASE}/api/social/posts/${postId}/like`, { method: "POST", headers });
    const data = await res.json();
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: data.liked, likeCount: data.liked ? p.likeCount + 1 : p.likeCount - 1 } : p));
  };

  const handleDelete = async (postId: number) => {
    await fetch(`${BASE}/api/social/posts/${postId}`, { method: "DELETE", headers });
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast({ title: "Post deleted" });
  };

  return (
    <DashboardLayout role={user?.role as any} title="">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-white font-display">
            2tor<span className="text-accent">Socialise</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Connect, share, and inspire the 2torConnect community</p>
        </div>

        {/* Compose */}
        <div className="glass-panel rounded-3xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="me" className="w-full h-full object-cover" />
                : <span>{user?.name?.charAt(0).toUpperCase()}</span>}
            </div>
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none focus:outline-none text-sm leading-relaxed min-h-[80px]"
              placeholder={postType === "tweet" ? "What's on your mind?" : postType === "reel" ? "Add a caption for your reel..." : "Share something with the community..."}
            />
          </div>

          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden mb-3 bg-black/40">
              {mediaFile?.type.startsWith("video") ? <video src={mediaPreview} controls className="w-full max-h-64 object-contain" /> : <img src={mediaPreview} alt="preview" className="w-full max-h-64 object-cover" />}
              <button onClick={() => { setMediaFile(null); setMediaPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-1">
              {POST_TYPES.map(pt => (
                <button key={pt.type} onClick={() => setPostType(pt.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${postType === pt.type ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}>
                  <pt.icon className={`w-3.5 h-3.5 ${pt.color}`} />
                  <span className="hidden sm:inline">{pt.label}</span>
                </button>
              ))}
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-all" title="Attach media">
                <Image className="w-4 h-4" />
              </button>
            </div>
            <button onClick={handlePost} disabled={creating || (!content.trim() && !mediaFile)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Post</>}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: "all", label: "All", icon: Radio }, ...POST_TYPES].map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeFilter === f.id ? "bg-gradient-to-r from-primary to-accent text-white shadow-md" : "glass-panel text-muted-foreground hover:text-white"
              }`}>
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-accent" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Feather className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-white font-bold text-lg mb-1">Nothing here yet</p>
            <p className="text-muted-foreground text-sm">Be the first to post something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map(post => (
                <PostCard key={post.id} post={post} currentUserId={user?.id ?? 0}
                  onLike={handleLike} onDelete={handleDelete} onComment={id => setCommentPostId(id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {commentPostId && <CommentDrawer postId={commentPostId} onClose={() => setCommentPostId(null)} />}
    </DashboardLayout>
  );
}
