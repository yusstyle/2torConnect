import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";
import { PenTool, Download, Sparkles } from "lucide-react";

export default function WhiteboardPage() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout title="2torBoard · Digital Whiteboard" role={user?.role as any}>
      <div className="flex flex-col h-[calc(100vh-8.5rem)]">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent/20 text-accent">
                <PenTool className="w-5 h-5" />
              </span>
              2torBoard
            </h1>
            <p className="text-xs text-muted-foreground">
              Interactive sketchpad for math derivations, science diagrams, and lecture notes.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Draw with finger, mouse, or stylus</span>
          </div>
        </div>

        {/* Full Interactive Canvas */}
        <div className="flex-1 min-h-0">
          <WhiteboardCanvas initialBackground="grid" />
        </div>
      </div>
    </DashboardLayout>
  );
}

