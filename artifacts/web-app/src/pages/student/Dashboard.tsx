import { useAuthStore } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListSessions, useGetTutor } from "@workspace/api-client-react";
import { BookOpen, Clock, CheckCircle2, Video } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { data: sessionsData, isLoading } = useListSessions({ studentId: user?.id, limit: 5 });
  
  const upcomingSessions = sessionsData?.sessions.filter(s => s.status === 'confirmed') || [];
  const completedSessions = sessionsData?.sessions.filter(s => s.status === 'completed') || [];

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="text-muted-foreground">Here's an overview of your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-accent">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/20 text-accent">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Sessions</p>
              <p className="text-3xl font-bold text-white mt-1">{upcomingSessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-primary">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Sessions</p>
              <p className="text-3xl font-bold text-white mt-1">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white mb-1">Need help?</p>
              <p className="text-sm text-muted-foreground">Find a tutor now</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 text-white">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CalendarIcon className="text-accent" /> Upcoming Schedule
          </h2>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1,2].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
            </div>
          ) : upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map(session => (
                <div key={session.id} className="p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-black/40 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{session.subject}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent font-medium">Confirmed</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">with {session.tutorName}</p>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {format(new Date(session.scheduledAt), "MMM d, h:mm a")}</span>
                    <span className="flex items-center gap-1.5"><Video className="w-4 h-4" /> {session.durationMinutes} mins</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-white font-medium mb-1">No upcoming sessions</p>
              <p className="text-sm text-muted-foreground mb-4">You have a clear schedule right now.</p>
            </div>
          )}
        </div>
        
        <div className="glass-panel rounded-2xl p-6">
           <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
           <div className="space-y-6">
             {/* Timeline stub */}
             <div className="relative pl-6 border-l border-white/10 space-y-8">
               <div className="relative">
                 <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                 <p className="text-sm text-muted-foreground mb-1">Today</p>
                 <p className="text-white font-medium">Logged into platform</p>
               </div>
               <div className="relative">
                 <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-white/20 ring-4 ring-background" />
                 <p className="text-sm text-muted-foreground mb-1">2 days ago</p>
                 <p className="text-white font-medium">Completed Physics 101 session</p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return <Clock className={className} />; // reuse clock for calendar concept
}
