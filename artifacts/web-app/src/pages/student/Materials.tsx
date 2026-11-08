import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search, Download, BookOpen, FileText, Loader2, Filter, Star, Sparkles,
  Share2, Eye, Printer, GraduationCap, CheckCircle2, ChevronRight, UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getApiUrl } from "@/lib/api";
import { VERIFIED_CAMPUS_STUDY_PACKS, type StudyPack } from "@/lib/study-packs-data";
import StudyPackModal from "@/components/StudyPackModal";
import { sharePastQuestionsToWhatsApp } from "@/lib/whatsapp";
import { Link } from "wouter";

interface Material {
  id: number;
  title: string;
  description?: string;
  subject: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  downloads: number;
  createdAt: string;
  tutorId: number;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-500/20 text-red-400 border-red-500/20",
  DOC: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  DOCX: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  PPT: "bg-orange-500/20 text-orange-400 border-orange-500/20",
  PPTX: "bg-orange-500/20 text-orange-400 border-orange-500/20",
  XLSX: "bg-green-500/20 text-green-400 border-green-500/20",
  XLS: "bg-green-500/20 text-green-400 border-green-500/20",
  TXT: "bg-gray-500/20 text-gray-400 border-gray-500/20",
  PNG: "bg-purple-500/20 text-purple-400 border-purple-500/20",
  JPG: "bg-purple-500/20 text-purple-400 border-purple-500/20",
};

export default function StudentMaterialsPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"packs" | "tutor-uploads">("packs");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");

  const [activePack, setActivePack] = useState<StudyPack | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`${getApiUrl()}/materials?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials ?? []);
      }
    } catch {
      console.warn("Could not load backend uploaded materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tutor-uploads") {
      fetchMaterials();
    }
  }, [activeTab, search]);

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredPacks = VERIFIED_CAMPUS_STUDY_PACKS.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase()) ||
      p.universities.some((u) => u.toLowerCase().includes(search.toLowerCase()));
    const matchFaculty = selectedFaculty === "all" || p.faculty.toLowerCase() === selectedFaculty.toLowerCase();
    return matchSearch && matchFaculty;
  });

  return (
    <DashboardLayout role="student" title="Study Materials & Notes Marketplace">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Hero Header */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 bg-gradient-to-r from-primary/10 via-background to-accent/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                <Sparkles className="w-3.5 h-3.5" /> 2torNotes • Verified Campus Study Packs
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Lecture Notes, Formula Sheets & Exam Handbooks
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access curated revision packs written by first-class students and top tutors across UNILAG, ABU, UI, OAU, UNN, and Covenant. Read sample notes, review key formulas, and print complete study guides.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/student/find-tutor"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <UserCheck className="w-4 h-4" /> Book a Tutor for These Notes
              </Link>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("packs")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "packs"
                ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Verified Campus Study Packs ({filteredPacks.length})
          </button>

          <button
            onClick={() => setActiveTab("tutor-uploads")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "tutor-uploads"
                ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" /> Tutor Uploaded Files & Slides ({materials.length})
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course code (e.g. MTH 101, PHY 101, GST 101), title, or university..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent text-sm"
            />
          </div>

          {activeTab === "packs" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none font-medium"
              >
                <option value="all">All Faculties</option>
                <option value="Science">Faculty of Science</option>
                <option value="General">General Studies (GST)</option>
                <option value="Management">Management & Social Sciences</option>
                <option value="Engineering">Faculty of Engineering</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: Verified Campus Study Packs */}
        {activeTab === "packs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPacks.map((pack) => (
              <div
                key={pack.id}
                className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-accent/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 border border-accent/40 text-accent font-extrabold text-xs tracking-wide">
                      {pack.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {pack.rating}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        FREE
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors leading-snug">
                      {pack.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {pack.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <p className="text-xs text-white/90 font-medium truncate">
                      Author: <span className="text-accent">{pack.authorName}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {pack.authorUniversity}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>{pack.pages} Pages • {pack.fileSize}</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Download className="w-3 h-3" /> {pack.downloads.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => setActivePack(pack)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 shadow-md transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read & Download
                  </button>
                  <button
                    onClick={() => {
                      const msg = `Check out this verified ${pack.code} Study Pack on 2torConnect:\nhttps://www.2torconnect.com/student/materials`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all"
                    title="Share to WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Tutor Uploaded Files */}
        {activeTab === "tutor-uploads" && (
          <div>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : materials.length === 0 ? (
              <div className="glass-panel rounded-3xl p-14 text-center border border-white/10 space-y-3">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-bold text-white">No tutor uploads match your search</h3>
                <p className="text-muted-foreground text-xs max-w-md mx-auto">
                  Switch back to <strong>Verified Campus Study Packs</strong> above to access pre-loaded lecture summaries and formula sheets.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${FILE_TYPE_COLORS[m.fileType] ?? "bg-white/10 text-white/60 border-white/10"}`}>
                          {m.fileType}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Download className="w-3 h-3" /> {m.downloads}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-white font-bold leading-snug">{m.title}</h3>
                        {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">{m.subject}</span>
                        <span>{fmtSize(m.fileSize)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-end">
                      <a
                        href={`${getApiUrl()}/materials/${m.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/20 text-accent text-xs font-bold hover:bg-accent/30 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download File
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal preview */}
        {activePack && (
          <StudyPackModal pack={activePack} onClose={() => setActivePack(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}
