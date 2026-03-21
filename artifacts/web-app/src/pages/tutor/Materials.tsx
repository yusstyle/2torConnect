import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Upload, FileText, Trash2, Loader2, X, BookOpen, Download, FilePlus } from "lucide-react";
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
}

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-500/20 text-red-400",
  DOC: "bg-blue-500/20 text-blue-400",
  DOCX: "bg-blue-500/20 text-blue-400",
  PPT: "bg-orange-500/20 text-orange-400",
  PPTX: "bg-orange-500/20 text-orange-400",
  XLSX: "bg-green-500/20 text-green-400",
  XLS: "bg-green-500/20 text-green-400",
  TXT: "bg-gray-500/20 text-gray-400",
  PNG: "bg-purple-500/20 text-purple-400",
  JPG: "bg-purple-500/20 text-purple-400",
};

export default function TutorMaterialsPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchMaterials = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/materials?tutorId=${user.id}`, { headers });
      const data = await res.json();
      setMaterials(data.materials ?? []);
    } catch {
      toast({ variant: "destructive", title: "Failed to load materials" });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => { fetchMaterials(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast({ variant: "destructive", title: "Please select a file" }); return; }
    if (!form.title || !form.subject) { toast({ variant: "destructive", title: "Title and subject are required" }); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("title", form.title);
      fd.append("subject", form.subject);
      if (form.description) fd.append("description", form.description);

      const res = await fetch(`${API}/materials`, {
        method: "POST",
        headers,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Material uploaded!", description: `${selectedFile.name} is now available to students.` });
      setForm({ title: "", description: "", subject: "" });
      setSelectedFile(null);
      setShowForm(false);
      await fetchMaterials();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: String(err.message) });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API}/materials/${id}`, { method: "DELETE", headers });
      toast({ title: "Material deleted" });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout role="tutor" title="Study Materials">
      <div className="space-y-6">

        {/* Upload button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
          >
            {showForm ? <X className="w-5 h-5" /> : <FilePlus className="w-5 h-5" />}
            {showForm ? "Cancel" : "Upload Material"}
          </button>
        </div>

        {/* Upload form */}
        {showForm && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5">Upload New Material</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Title *</label>
                  <input
                    type="text" required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                    placeholder="e.g. MTH 301 Midterm Solutions" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Subject *</label>
                  <input
                    type="text" required value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                    placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all resize-none"
                  placeholder="What's in this file? (optional)" />
              </div>

              {/* File drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${selectedFile ? "border-accent/50 bg-accent/5" : "border-white/15 hover:border-white/30"}`}
              >
                <input ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-accent" />
                    <div className="text-left">
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{fmtSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-white/60">Click to select a file</p>
                    <p className="text-xs text-white/40 mt-1">PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT, Images · Max 20MB</p>
                  </>
                )}
              </div>

              <button type="submit" disabled={uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5" /> Upload Material</>}
              </button>
            </form>
          </div>
        )}

        {/* Materials list */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Your Uploaded Materials</h3>
            <span className="text-sm text-muted-foreground">{materials.length} file{materials.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : materials.length === 0 ? (
            <div className="text-center py-14">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-white/60 font-medium">No materials uploaded yet</p>
              <p className="text-white/40 text-sm mt-1">Upload notes, past questions, or slides to help your students.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {materials.map(m => (
                <div key={m.id} className="flex items-center gap-4 p-5 hover:bg-white/2 transition-colors">
                  <div className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${FILE_TYPE_COLORS[m.fileType] ?? "bg-white/10 text-white/60"}`}>
                    {m.fileType}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{m.subject} · {fmtSize(m.fileSize)} · {format(new Date(m.createdAt), "MMM d, yyyy")}</p>
                    {m.description && <p className="text-xs text-white/40 mt-0.5 truncate">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{m.downloads}</span>
                    <a href={`${API}/materials/${m.id}/download`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDelete(m.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
