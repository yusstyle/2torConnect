import { useState, useRef, useEffect } from "react";
import { X, Download, Share2, Sparkles, Check, Loader2, Camera, Award } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";

interface TutorFlyerModalProps {
  tutor: {
    name: string;
    avatarUrl?: string | null;
    university?: string;
    hourlyRate?: number | string | null;
    subjects?: string[];
    rating?: number;
    sessionsCount?: number;
  };
  onClose: () => void;
}

export default function TutorFlyerModal({ tutor, onClose }: TutorFlyerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const subjects = tutor.subjects && tutor.subjects.length > 0
    ? tutor.subjects
    : ["Calculus & Algebra (MTH 101)", "General Physics (PHY 101)", "Exam Prep & Past Questions"];
  const rate = Number(tutor.hourlyRate || 2500);
  const university = tutor.university || "University Campus";

  // Draw the flyer onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: 800 x 1000 px
    const W = 800;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;

    // 1. Dark Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#080b12");
    bgGrad.addColorStop(0.5, "#0d1424");
    bgGrad.addColorStop(1, "#150d24");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Glow Circles
    const glow1 = ctx.createRadialGradient(150, 150, 20, 150, 150, 350);
    glow1.addColorStop(0, "rgba(6, 182, 212, 0.25)");
    glow1.addColorStop(1, "rgba(6, 182, 212, 0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(700, 800, 20, 700, 800, 400);
    glow2.addColorStop(0, "rgba(168, 85, 247, 0.25)");
    glow2.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // 3. Decorative Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // 4. Header Badge: 2torConnect
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    roundRect(ctx, W / 2 - 140, 50, 280, 44, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, W / 2 - 140, 50, 280, 44, 22);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("2torConnect • Peer Tutoring", W / 2, 78);

    // 5. Hero Hook
    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("EXAM PREPARATION & PRIVATE TUTORING", W / 2, 140);

    ctx.fillStyle = "#ffffff";
    ctx.font = "extrabold 36px sans-serif";
    ctx.fillText("Ace Your Semester Exams", W / 2, 185);

    // 6. Tutor Avatar Circle
    const avatarX = W / 2;
    const avatarY = 300;
    const avatarRadius = 70;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
    const ringGrad = ctx.createLinearGradient(avatarX - 80, avatarY - 80, avatarX + 80, avatarY + 80);
    ringGrad.addColorStop(0, "#06b6d4");
    ringGrad.addColorStop(1, "#a855f7");
    ctx.fillStyle = ringGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.restore();

    // Initials Fallback in Circle
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    const initials = tutor.name
      ? tutor.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
      : "2T";
    ctx.fillText(initials, avatarX, avatarY + 16);

    // Verified badge below avatar
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    roundRect(ctx, W / 2 - 110, 390, 220, 32, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("✓ VERIFIED CAMPUS TUTOR", W / 2, 411);

    // 7. Tutor Name & University
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(tutor.name || "Campus Tutor", W / 2, 465);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px sans-serif";
    ctx.fillText(university, W / 2, 495);

    // 8. Courses Card
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    roundRect(ctx, 80, 530, W - 160, 240, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    roundRect(ctx, 80, 530, W - 160, 240, 24);
    ctx.stroke();

    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COURSES & MODULES OFFERED", W / 2, 570);

    // Render course chips
    ctx.font = "bold 17px sans-serif";
    let courseY = 620;
    subjects.slice(0, 3).forEach((sub) => {
      ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
      roundRect(ctx, 120, courseY - 26, W - 240, 42, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      roundRect(ctx, 120, courseY - 26, W - 240, 42, 12);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(`📚 ${sub}`, W / 2, courseY + 2);
      courseY += 56;
    });

    // 9. Rate & Pricing Banner
    ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
    roundRect(ctx, 100, 800, W - 200, 80, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
    roundRect(ctx, 100, 800, W - 200, 80, 20);
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "14px sans-serif";
    ctx.fillText("HOURLY LESSON FEE", W / 2, 828);

    ctx.fillStyle = "#a855f7";
    ctx.font = "extrabold 32px sans-serif";
    ctx.fillText(`₦${rate.toLocaleString()} / session`, W / 2, 862);

    // 10. Footer Call to Action
    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Book Live 1-on-1 Sessions Online:", W / 2, 925);

    ctx.fillStyle = "#ffffff";
    ctx.font = "extrabold 22px sans-serif";
    ctx.fillText("www.2torconnect.com", W / 2, 955);
  }, [tutor]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const a = document.createElement("a");
      a.download = `2torConnect-Flyer-${tutor.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast({ title: "Flyer Downloaded! 🎨", description: "You can now post this image to your WhatsApp Status!" });
    } catch {
      toast({ variant: "destructive", title: "Could not download image" });
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const message =
      `👋 *Need Help Passing Your Courses This Semester?*\n\n` +
      `I am a verified tutor on 2torConnect offering 1-on-1 and group exam preparation lessons!\n\n` +
      `👨‍🏫 *Tutor:* ${tutor.name}\n` +
      `🎓 *University:* ${university}\n` +
      `📚 *Courses:* ${subjects.join(", ")}\n` +
      `💳 *Rate:* ₦${rate.toLocaleString()}/session\n\n` +
      `👇 *Book a private lesson with me directly on 2torConnect:*\n` +
      `https://www.2torconnect.com/student/find-tutor\n\n` +
      `_Ace your continuous assessments and exams with confidence!_`;

    window.open(getWhatsAppUrl(message), "_blank");
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/10 space-y-5 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Your WhatsApp Status Flyer
            </h3>
            <p className="text-xs text-muted-foreground">Download and share to WhatsApp Status to get new paying students</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex justify-center bg-black/60">
          <canvas ref={canvasRef} className="w-full max-w-[360px] h-auto object-contain rounded-2xl" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Image (PNG)
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            <Share2 className="w-4 h-4" />
            Share to WhatsApp Status
          </button>
        </div>
      </div>
    </div>
  );
}

