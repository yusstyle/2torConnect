import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useListTutors, useCreateSession } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/auth";
import { Search, Star, BookOpen, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FindTutorPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListTutors({ search, limit: 50 });
  const [selectedTutor, setSelectedTutor] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  const tutors = data?.tutors || [];

  const handleMessage = (userId: number, name: string) => {
    setLocation(`/messages?with=${userId}&name=${encodeURIComponent(name)}`);
  };

  return (
    <DashboardLayout title="Find a Tutor" role="student">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Find a Tutor</h1>
          <p className="text-muted-foreground">Search by subject, university, or name</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            placeholder="Search tutors..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : tutors.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-semibold text-white mb-2">No tutors found</p>
          <p>Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tutors.map((tutor) => (
            <div key={tutor.id} className="glass-panel rounded-2xl p-6 flex flex-col hover:border-accent/30 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20">
                    {tutor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{tutor.name}</h3>
                    <p className="text-sm text-muted-foreground">{tutor.university || 'University Student'}</p>
                    {tutor.department && (
                      <p className="text-xs text-accent/80">{tutor.department}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg text-sm font-bold">
                  <Star className="w-4 h-4 fill-current" /> {tutor.rating || 'New'}
                </div>
              </div>

              <div className="mb-5 flex-1">
                {(tutor.subjects?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tutor.subjects?.slice(0, 4).map(sub => (
                      <span key={sub} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-md text-white/80">
                        {sub}
                      </span>
                    ))}
                    {(tutor.subjects?.length ?? 0) > 4 && (
                      <span className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-md text-white/60">
                        +{(tutor.subjects?.length ?? 0) - 4} more
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{tutor.aboutYou || 'No bio provided.'}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
                <div className="text-white font-bold">
                  ₦{tutor.hourlyRate || '1500'}<span className="text-sm text-muted-foreground font-normal">/hr</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMessage(tutor.userId, tutor.name)}
                    title="Send a message"
                    className="px-3 py-2 bg-white/10 hover:bg-primary/30 hover:border-primary border border-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </button>
                  <button
                    onClick={() => setSelectedTutor(tutor.id)}
                    className="px-4 py-2 bg-white/10 hover:bg-accent hover:text-background text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Book</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTutor && (
        <BookingModal tutorId={selectedTutor} onClose={() => setSelectedTutor(null)} />
      )}
    </DashboardLayout>
  );
}

function BookingModal({ tutorId, onClose }: { tutorId: number, onClose: () => void }) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
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
    bookMutation.mutate({
      data: { tutorId, studentId: user.id, subject, scheduledAt, durationMinutes: 60, notes }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white text-2xl leading-none">×</button>
        <h2 className="text-2xl font-bold text-white mb-6">Book Session</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Subject</label>
            <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none" placeholder="e.g. Calculus 101" />
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
            <label className="block text-sm font-medium text-white/80 mb-2">Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent focus:outline-none min-h-24" placeholder="What do you need help with?" />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={bookMutation.isPending} className="flex-1 py-3 rounded-xl bg-accent text-background font-bold hover:opacity-90 flex justify-center items-center gap-2 disabled:opacity-50">
              {bookMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
