import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, GraduationCap, MessageSquare, Filter, BookOpen, CheckCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const UNIVERSITIES = [
  "All Universities", "University of Lagos", "University of Ibadan",
  "Obafemi Awolowo University", "University of Nigeria Nsukka", "ABU Zaria",
  "University of Benin", "FUTA", "Covenant University", "Babcock University",
  "Pan-Atlantic University", "Lagos State University", "Delta State University",
];

const SUBJECTS = [
  "All Subjects", "Mathematics", "Physics", "Chemistry", "Biology",
  "Engineering", "Computer Science", "Economics", "Law", "Medicine",
  "Accounting", "Mass Communication", "Architecture",
];

const SUBJECTS_SAMPLE = ["Mathematics", "Physics", "Computer Science", "Economics", "Biology", "Chemistry", "Law", "Medicine"];
const getRandomSubject = (id: number) => SUBJECTS_SAMPLE[id % SUBJECTS_SAMPLE.length];
const getRandomUniversity = (id: number) => UNIVERSITIES.slice(1)[id % (UNIVERSITIES.length - 1)];
const getRandomYear = (id: number) => ["100L", "200L", "300L", "400L", "500L"][id % 5];

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400 bg-green-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  suspended: "text-red-400 bg-red-400/10",
};

export default function InvestorStudents() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("All Universities");
  const [subject, setSubject] = useState("All Subjects");

  const { data, isLoading } = useQuery({
    queryKey: ["investor-students", search],
    queryFn: async () => {
      const params = new URLSearchParams({ role: "student", limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`${BASE}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load students");
      return res.json() as Promise<{ users: Array<{ id: number; name: string; email: string; status: string; createdAt: string }> }>;
    },
    staleTime: 30_000,
  });

  const students = data?.users ?? [];

  return (
    <DashboardLayout role="investor" title="Find Students to Help">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-accent/20 via-accent/5 to-primary/10 border border-accent/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,212,255,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Browse Students</h2>
              <p className="text-white/60 text-sm">Find talented students across Nigerian universities to fund and support.</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={university} onChange={e => setUniversity(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50">
              {UNIVERSITIES.map(u => <option key={u} value={u} className="bg-background">{u}</option>)}
            </select>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent/50">
              {SUBJECTS.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">No students found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search or check back later</p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">{students.length} student{students.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student, i) => (
                <motion.div key={student.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel rounded-2xl p-5 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center font-bold text-white text-lg shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{student.name}</p>
                      <p className="text-muted-foreground text-xs truncate">{student.email}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${STATUS_COLORS[student.status] ?? "text-muted-foreground bg-white/5"}`}>
                        {student.status === "active" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {student.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GraduationCap className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{getRandomUniversity(student.id)} · {getRandomYear(student.id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{getRandomSubject(student.id)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href="/messages"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-medium transition-all">
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </a>
                    <button className="flex-1 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white text-xs font-bold hover:opacity-90 transition-all">
                      Fund Student
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
