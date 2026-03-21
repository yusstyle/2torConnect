import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Download, BookOpen, FileText, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

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

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (subject) params.set("subject", subject);
      const res = await fetch(`${API}/materials?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMaterials(data.materials ?? []);
    } catch {
      toast({ variant: "destructive", title: "Failed to load materials" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, [search, subject]);

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const subjects = [...new Set(materials.map(m => m.subject))].sort();

  return (
    <DashboardLayout role="student" title="Study Materials">
      <div className="space-y-6">
        <p className="text-white/60 -mt-4">Browse notes, past questions, and slides shared by verified tutors.</p>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="search" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials by title..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-8 text-white focus:outline-none focus:border-accent appearance-none min-w-[160px]">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Materials grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : materials.length === 0 ? (
          <div className="glass-panel rounded-2xl p-14 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No materials found</h3>
            <p className="text-muted-foreground text-sm">Try a different search term or check back later as tutors upload new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(m => (
              <div key={m.id} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-all hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between gap-2">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${FILE_TYPE_COLORS[m.fileType] ?? "bg-white/10 text-white/60 border-white/10"}`}>
                    {m.fileType}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="w-3 h-3" />{m.downloads}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-semibold leading-snug mb-1">{m.title}</h3>
                  {m.description && <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{m.description}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{m.subject}</span>
                    <p className="text-xs text-white/40 mt-1">{fmtSize(m.fileSize)} · {format(new Date(m.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <a
                    href={`${API}/materials/${m.id}/download`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors group-hover:shadow-lg group-hover:shadow-accent/10"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
