import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { useGetTutorAvailability, useSetTutorAvailability } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type SlotState = { enabled: boolean; startTime: string; endTime: string };

export default function TutorAvailabilityPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const tutorId = user?.id ?? 0;

  const { data, isLoading } = useGetTutorAvailability(tutorId);

  const [slots, setSlots] = useState<SlotState[]>(
    DAYS.map(() => ({ enabled: false, startTime: "09:00", endTime: "17:00" }))
  );

  useEffect(() => {
    if (data?.slots) {
      const updated = DAYS.map((_, i) => {
        const slot = data.slots.find(s => s.dayOfWeek === i);
        if (slot) return { enabled: slot.isAvailable ?? true, startTime: slot.startTime, endTime: slot.endTime };
        return { enabled: false, startTime: "09:00", endTime: "17:00" };
      });
      setSlots(updated);
    }
  }, [data]);

  const saveMutation = useSetTutorAvailability({
    mutation: {
      onSuccess: () => toast({ title: "Availability saved!" }),
      onError: () => toast({ variant: "destructive", title: "Failed to save availability" }),
    },
  });

  const toggle = (i: number) => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s));
  const setTime = (i: number, field: "startTime" | "endTime") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: e.target.value } : s));

  const handleSave = () => {
    const enabledSlots = slots
      .map((s, i) => ({ dayOfWeek: i, startTime: s.startTime, endTime: s.endTime, isAvailable: s.enabled }))
      .filter(s => s.isAvailable);
    saveMutation.mutate({ id: tutorId, data: { slots: enabledSlots } });
  };

  return (
    <DashboardLayout role="tutor" title="Manage Availability">
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-muted-foreground mb-6">Set the days and times you are available to teach. Students can only book sessions during these hours.</p>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : (
            <div className="space-y-3">
              {DAYS.map((day, i) => (
                <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl transition-colors ${slots[i].enabled ? "bg-accent/5 border border-accent/20" : "bg-black/20"}`}>
                  <div className="flex items-center gap-3 sm:w-36">
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${slots[i].enabled ? "bg-accent" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${slots[i].enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                    <span className={`font-medium ${slots[i].enabled ? "text-white" : "text-muted-foreground"}`}>{day}</span>
                  </div>
                  {slots[i].enabled && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">From</label>
                        <input type="time" value={slots[i].startTime} onChange={setTime(i, "startTime")}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">To</label>
                        <input type="time" value={slots[i].endTime} onChange={setTime(i, "endTime")}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Availability
        </button>
      </div>
    </DashboardLayout>
  );
}
