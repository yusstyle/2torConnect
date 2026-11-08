import { useState } from "react";
import {
  X, Download, Share2, BookOpen, Star, FileText, Check, Printer,
  GraduationCap, UserCheck, Sparkles, ChevronRight
} from "lucide-react";
import { type StudyPack } from "@/lib/study-packs-data";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface StudyPackModalProps {
  pack: StudyPack;
  onClose: () => void;
}

export default function StudyPackModal({ pack, onClose }: StudyPackModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "toc" | "formulas">("preview");
  const { toast } = useToast();

  const handleShareWhatsApp = () => {
    const msg =
      `📚 *${pack.code}: ${pack.title}*\n\n` +
      `Hey! Check out this verified lecture revision study pack on 2torConnect:\n` +
      `👤 *Author:* ${pack.authorName} (${pack.authorUniversity})\n` +
      `⭐ *Rating:* ${pack.rating} / 5.0 (${pack.reviewsCount} reviews)\n` +
      `📄 *Pages:* ${pack.pages} Pages • ${pack.fileSize}\n` +
      `💡 *Includes:* Complete lecture summary, key formulas, and past exam worked solutions.\n\n` +
      `Download and study it free here:\n` +
      `👉 https://www.2torconnect.com/student/materials`;

    window.open(getWhatsAppUrl(msg), "_blank");
  };

  const handleDownload = () => {
    // Generate formatted printable HTML document
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ variant: "destructive", title: "Pop-up blocked", description: "Please allow pop-ups to open the printable study guide." });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${pack.code} - ${pack.title} | 2torConnect Study Pack</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #111; padding: 40px; max-width: 800px; margin: auto; }
          .header { border-bottom: 2px solid #06b6d4; padding-bottom: 20px; margin-bottom: 24px; }
          .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 999px; font-weight: bold; font-size: 12px; }
          h1 { margin: 10px 0 5px 0; font-size: 26px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 15px; }
          h2 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; font-size: 18px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 6px; font-size: 14px; }
          .formula-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #06b6d4; padding: 12px 16px; margin: 10px 0; font-family: monospace; font-size: 13px; border-radius: 6px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge">2torConnect Campus Study Pack</span>
          <h1>${pack.code}: ${pack.title}</h1>
          <div class="meta">
            Author: <strong>${pack.authorName}</strong> (${pack.authorUniversity}) • ${pack.pages} Pages • Rating: ${pack.rating}★
          </div>
          <p style="font-size: 14px; color: #334155;">${pack.description}</p>
        </div>

        <h2>Table of Contents</h2>
        <ul>
          ${pack.tableOfContents.map((c) => `<li>${c}</li>`).join("")}
        </ul>

        <h2>Essential Formulas & Golden Rules</h2>
        ${pack.keyFormulas.map((f) => `<div class="formula-box">${f}</div>`).join("")}

        <h2>Core Lecture Notes & Worked Examples</h2>
        <div style="font-size: 14px; white-space: pre-line;">
          ${pack.sampleNotesPreview}
        </div>

        <div class="footer">
          © 2026 2torConnect • Peer Tutoring & Exam Preparation • www.2torconnect.com
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast({ title: "Study Pack Opened! 📄", description: "You can now save as PDF or print this study guide." });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-primary/30 to-accent/30 border border-accent/40 text-accent">
                {pack.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-muted-foreground">
                {pack.faculty} • {pack.level}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {pack.rating} ({pack.reviewsCount} reviews)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {pack.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              By <strong className="text-white">{pack.authorName}</strong> · {pack.authorUniversity}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === "preview"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Sample Notes & Concepts
          </button>
          <button
            onClick={() => setActiveTab("formulas")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === "formulas"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Key Formulas ({pack.keyFormulas.length})
          </button>
          <button
            onClick={() => setActiveTab("toc")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === "toc"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Table of Contents ({pack.tableOfContents.length})
          </button>
        </div>

        {/* Tab 1: Preview */}
        {activeTab === "preview" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pack.description}
              </p>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-white">Covered Universities:</span> {pack.universities.join(", ")}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-3 font-mono text-xs text-white/90 whitespace-pre-line leading-relaxed max-h-[300px] overflow-y-auto">
              {pack.sampleNotesPreview}
            </div>
          </div>
        )}

        {/* Tab 2: Formulas */}
        {activeTab === "formulas" && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {pack.keyFormulas.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-black/40 border border-accent/20 text-xs font-mono text-cyan-300 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-md bg-accent/20 text-accent font-bold flex items-center justify-center text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Table of Contents */}
        {activeTab === "toc" && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pack.tableOfContents.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/90 flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tutor CTA Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-accent/10 border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Need this course explained step-by-step?
            </p>
            <p className="text-[11px] text-muted-foreground">Book private 1-on-1 exam prep with a verified peer tutor.</p>
          </div>
          <Link
            href={`/student/find-tutor?subject=${pack.code}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 transition-all shrink-0"
          >
            Find {pack.code} Tutor <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="text-xs text-muted-foreground">
            {pack.pages} Pages • {pack.fileSize} • {pack.downloads.toLocaleString()} Downloads
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share to WhatsApp Group
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Printer className="w-3.5 h-3.5" /> Download / Print PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

