import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCreateSession } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { Search, Star, BookOpen, MessageSquare, Loader2, Filter, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface Tutor {
  id: number; userId: number; name: string; university?: string; department?: string;
  subjects?: string[]; rating?: string; hourlyRate?: string; aboutYou?: string;
  avatarUrl?: string; totalSessions?: number;
}

function StarDisplay({ rating, size = "sm" }: { rating?: string | number | null; size?: "sm" | "md" }) {
  const val = Number(rating ?? 0);
  const cls = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${cls} ${i <= Math.round(val) ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-white/20"}`} />
      ))}
    </div>
  );
}

export default function FindTutorPage() {
  const [, setLocation] = useLocation();
  const { token } = useAuthStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [reviewTutorId, setReviewTutorId] = useState<number | null>(null);

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (subject) params.set("subject", subject);
      if (minRating) params.set("minRating", minRating);
      if (maxPrice) params.set("maxPrice", maxPrice);
      const r = await fetch(`${API}/tutors?${params}`, { headers });
      const d = await r.json();
      setTutors(d?.tutors ?? []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [search, subject, minRating, maxPrice]);

  const hasFilters = !!(subject || minRating || maxPrice);

  const handleMessage = (userId: number, name: string) => {
    setLocation(`/messages?with=${userId}&name=${encodeURIComponent(name)}`);
  };

  return (
    <DashboardLayout title="Find a Tutor" role="student">
      {/* Search + filter bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              placeholder="Search by name, subject or university..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-sm font-bold ${showFilters || hasFilters ? "bg-accent/20 border-accent/40 text-accent" : "bg-black/40 border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1.5">Subject</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-accent focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1.5">Min Rating</label>
                  <select
                    value={minRating}
                    onChange={e => setMinRating(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-accent focus:outline-none text-sm appearance-none"
                  >
                    <option value="">Any rating</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4">4.0+ ⭐</option>
                    <option value="3">3.0+ ⭐</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1.5">Max Price (₦/hr)</label>
                  <select
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:border-accent focus:outline-none text-sm appearance-none"
                  >
                    <option value="">Any price</option>
                    <option value="1000">Up to ₦1,000</option>
                    <option value="2000">Up to ₦2,000</option>
                    <option value="5000">Up to ₦5,000</option>
                  </select>
                </div>
                {hasFilters && (
                  <button
                    onClick={() => { setSubject(""); setMinRating(""); setMaxPrice(""); }}
                    className="sm:col-span-3 text-xs text-muted-foreground hover:text-white flex items-center gap-1 justify-end"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : tutors.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-semibold text-white mb-2">No tutors found</p>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tutors.map(tutor => (
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              onBook={() => setSelectedTutor(tutor)}
              onMessage={() => handleMessage(tutor.userId, tutor.name)}
              onReview={() => setReviewTutorId(tutor.userId)}
            />
          ))}
        </div>
      )}

      {selectedTutor && (
        <BookingModal tutor={selectedTutor} onClose={() => setSelectedTutor(null)} />
      )}
      {reviewTutorId && (
        <ReviewModal tutorId={reviewTutorId} onClose={() => setReviewTutorId(null)} />
      )}
    </DashboardLayout>
  );
}

function TutorCard({ tutor, onBook, onMessage, onReview }: { tutor: Tutor; onBook: () => void; onMessage: () => void; onReview: () => void }) {
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { token } = useAuthStore();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const hasRating = tutor.rating && Number(tutor.rating) > 0;

  const toggleReviews = async () => {
    setShowReviews(!showReviews);
    if (!showReviews && reviews.length === 0) {
      setReviewsLoading(true);
      try {
        const r = await fetch(`${API}/reviews?tutorId=${tutor.userId}`, { headers });
        const d = await r.json();
        setReviews(d.reviews ?? []);
      } catch {} finally { setReviewsLoading(false); }
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col hover:border-accent/30 transition-all duration-300 overflow-hidden">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0 overflow-hidden">
              {tutor.avatarUrl
                ? <img src={tutor.avatarUrl} className="w-full h-full object-cover" />
                : tutor.name.charAt(0)
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{tutor.name}</h3>
              <p className="text-xs text-muted-foreground">{tutor.university || "University Student"}</p>
              {tutor.department && <p className="text-xs text-accent/80">{tutor.department}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {hasRating ? (
              <>
                <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                  <Star className="w-3.5 h-3.5 fill-current" /> {Number(tutor.rating).toFixed(1)}
                </div>
                <StarDisplay rating={tutor.rating} />
              </>
            ) : (
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">New</span>
            )}
          </div>
        </div>

        {(tutor.subjects?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tutor.subjects?.slice(0, 4).map(sub => (
              <span key={sub} className="text-[11px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-white/70">{sub}</span>
            ))}
            {(tutor.subjects?.length ?? 0) > 4 && (
              <span className="text-[11px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-white/50">+{(tutor.subjects?.length ?? 0) - 4}</span>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{tutor.aboutYou || "No bio provided."}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {tutor.totalSessions ?? 0} sessions</span>
        </div>

        {/* Reviews toggle */}
        <button
          onClick={toggleReviews}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-white transition-colors border-t border-white/10 pt-3 mb-3"
        >
          <span>See reviews</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showReviews ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showReviews && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {reviewsLoading ? (
                  <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-accent" /></div>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2">No reviews yet</p>
                ) : reviews.map(r => (
                  <div key={r.id} className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {r.studentName?.charAt(0) ?? "?"}
                      </div>
                      <span className="text-white text-xs font-medium">{r.studentName}</span>
                      <StarDisplay rating={r.rating} />
                    </div>
                    {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-6 pb-5 gap-3 border-t border-white/10 pt-4">
        <div className="text-white font-bold text-sm">
          ₦{Number(tutor.hourlyRate || 1500).toLocaleString()}<span className="text-muted-foreground font-normal text-xs">/hr</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReview}
            title="Leave a review"
            className="p-2 bg-white/10 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/30 text-muted-foreground hover:text-yellow-400 rounded-xl transition-all"
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={onMessage}
            title="Send a message"
            className="px-3 py-2 bg-white/10 hover:bg-primary/30 hover:border-primary border border-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>
          <button
            onClick={onBook}
            className="px-3 py-2 bg-white/10 hover:bg-accent hover:text-background text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Book</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ tutorId, onClose }: { tutorId: number; onClose: () => void }) {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast({ variant: "destructive", title: "Please select a rating" }); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/reviews`, {
        method: "POST", headers,
        body: JSON.stringify({ tutorId, rating, comment }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "Review submitted! 🌟", description: "Thank you for your feedback." });
      onClose();
    } catch { toast({ variant: "destructive", title: "Failed to submit review" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-md rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Rate this Tutor</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-4">How would you rate your experience?</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-9 h-9 ${i <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-white/20"} transition-colors`} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-semibold text-yellow-400 mt-2">
                {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-accent focus:outline-none text-sm resize-none"
              placeholder="Share your experience with this tutor..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving || rating === 0} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              Submit Review
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function BookingModal({ tutor, onClose }: { tutor: Tutor; onClose: () => void }) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [subject, setSubject] = useState(tutor.subjects?.[0] ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const bookMutation = useCreateSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session Requested!", description: "The tutor will review your request." });
        onClose();
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.data?.message || "Could not book session.";
        toast({ variant: "destructive", title: "Error", description: msg });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    bookMutation.mutate({ data: { tutorId: tutor.userId, studentId: user.id, subject, scheduledAt, durationMinutes: 60, notes } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-md rounded-3xl p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Book Session</h2>
            <p className="text-muted-foreground text-sm">with {tutor.name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Subject</label>
            <input required value={subject} onChange={e => setSubject(e.target.value)} list="subjects-list" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none" placeholder="e.g. Calculus 101" />
            {(tutor.subjects?.length ?? 0) > 0 && (
              <datalist id="subjects-list">{tutor.subjects?.map(s => <option key={s} value={s} />)}</datalist>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Time</label>
              <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none min-h-20 resize-none" placeholder="What do you need help with?" />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={bookMutation.isPending} className="flex-1 py-3 rounded-xl bg-accent text-background font-bold hover:opacity-90 flex justify-center items-center gap-2 disabled:opacity-50">
              {bookMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
