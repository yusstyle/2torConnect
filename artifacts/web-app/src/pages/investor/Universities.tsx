import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { GraduationCap, Search, MapPin, Users, BookOpen, Globe, ExternalLink } from "lucide-react";

const UNIVERSITIES = [
  { name: "University of Lagos", acronym: "UNILAG", state: "Lagos", type: "Federal", students: "60,000+", programs: 132, established: 1962, website: "https://unilag.edu.ng", color: "from-blue-500 to-cyan-400" },
  { name: "University of Ibadan", acronym: "UI", state: "Oyo", type: "Federal", students: "22,000+", programs: 98, established: 1948, website: "https://ui.edu.ng", color: "from-purple-500 to-indigo-400" },
  { name: "Obafemi Awolowo University", acronym: "OAU", state: "Osun", type: "Federal", students: "40,000+", programs: 118, established: 1961, website: "https://oauife.edu.ng", color: "from-green-500 to-emerald-400" },
  { name: "University of Nigeria", acronym: "UNN", state: "Enugu", type: "Federal", students: "37,000+", programs: 112, established: 1960, website: "https://unn.edu.ng", color: "from-red-500 to-orange-400" },
  { name: "Ahmadu Bello University", acronym: "ABU", state: "Kaduna", type: "Federal", students: "75,000+", programs: 145, established: 1962, website: "https://abu.edu.ng", color: "from-yellow-500 to-amber-400" },
  { name: "University of Benin", acronym: "UNIBEN", state: "Edo", type: "Federal", students: "48,000+", programs: 120, established: 1970, website: "https://uniben.edu.ng", color: "from-teal-500 to-cyan-400" },
  { name: "FUTA", acronym: "FUTA", state: "Ondo", type: "Federal", students: "15,000+", programs: 72, established: 1981, website: "https://futa.edu.ng", color: "from-pink-500 to-rose-400" },
  { name: "Covenant University", acronym: "CU", state: "Ogun", type: "Private", students: "12,000+", programs: 68, established: 2002, website: "https://covenantuniversity.edu.ng", color: "from-violet-500 to-purple-400" },
  { name: "Babcock University", acronym: "BU", state: "Ogun", type: "Private", students: "8,000+", programs: 55, established: 1999, website: "https://babcock.edu.ng", color: "from-sky-500 to-blue-400" },
  { name: "Lagos State University", acronym: "LASU", state: "Lagos", type: "State", students: "35,000+", programs: 100, established: 1983, website: "https://lasu.edu.ng", color: "from-lime-500 to-green-400" },
  { name: "Pan-Atlantic University", acronym: "PAU", state: "Lagos", type: "Private", students: "2,000+", programs: 24, established: 2002, website: "https://pau.edu.ng", color: "from-orange-500 to-yellow-400" },
  { name: "University of Port Harcourt", acronym: "UNIPORT", state: "Rivers", type: "Federal", students: "50,000+", programs: 130, established: 1975, website: "https://uniport.edu.ng", color: "from-cyan-500 to-sky-400" },
  { name: "Nnamdi Azikiwe University", acronym: "UNIZIK", state: "Anambra", type: "Federal", students: "30,000+", programs: 110, established: 1991, website: "https://unizik.edu.ng", color: "from-indigo-500 to-blue-400" },
  { name: "University of Abuja", acronym: "UNIABUJA", state: "FCT", type: "Federal", students: "20,000+", programs: 90, established: 1988, website: "https://uniabuja.edu.ng", color: "from-emerald-500 to-teal-400" },
  { name: "LAUTECH", acronym: "LAUTECH", state: "Oyo", type: "State", students: "18,000+", programs: 75, established: 1990, website: "https://lautech.edu.ng", color: "from-fuchsia-500 to-pink-400" },
];

const STATES = ["All States", ...Array.from(new Set(UNIVERSITIES.map(u => u.state))).sort()];
const TYPES = ["All Types", "Federal", "State", "Private"];

export default function InvestorUniversities() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("All States");
  const [type, setType] = useState("All Types");

  const filtered = UNIVERSITIES.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.acronym.toLowerCase().includes(search.toLowerCase());
    const matchState = state === "All States" || u.state === state;
    const matchType = type === "All Types" || u.type === type;
    return matchSearch && matchState && matchType;
  });

  return (
    <DashboardLayout role="investor" title="Browse Nigerian Universities">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,179,8,0.08),transparent)]" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-orange-400 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Nigerian Universities</h2>
              <p className="text-white/60 text-sm">Explore universities and find students and tutors to support across Nigeria.</p>
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
                placeholder="Search universities by name or acronym…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={state} onChange={e => setState(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50">
              {STATES.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)}
              className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/50">
              {TYPES.map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
            </select>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">{filtered.length} universit{filtered.length !== 1 ? "ies" : "y"} found</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((uni, i) => (
            <motion.div key={uni.acronym}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-panel rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all group"
            >
              <div className={`h-2 bg-gradient-to-r ${uni.color}`} />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${uni.color} flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-lg`}>
                    {uni.acronym.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm leading-tight">{uni.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-xs">{uni.state}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-1 ${uni.type === "Private" ? "bg-purple-500/20 text-purple-400" : uni.type === "State" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                        {uni.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Students", value: uni.students, icon: Users },
                    { label: "Programs", value: uni.programs, icon: BookOpen },
                    { label: "Est.", value: uni.established, icon: GraduationCap },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-2 rounded-xl bg-white/5">
                      <p className="text-white font-bold text-sm">{stat.value}</p>
                      <p className="text-muted-foreground text-[10px]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <a href="/investor/students"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white text-xs font-bold hover:opacity-90 transition-all">
                    <Users className="w-3.5 h-3.5" /> Find Students
                  </a>
                  <a href={uni.website} target="_blank" rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
