import { useState, useMemo } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Calculator, Plus, Trash2, Award, TrendingUp, AlertTriangle, Sparkles,
  Share2, Printer, BookOpen, GraduationCap, ChevronRight, CheckCircle2, RotateCcw
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";

interface CourseRow {
  id: string;
  code: string;
  units: number;
  grade: "A" | "B" | "C" | "D" | "E" | "F";
}

const GRADE_POINTS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

const GRADE_DESCRIPTIONS: Record<string, string> = {
  A: "70 - 100% (Excellent)",
  B: "60 - 69% (Very Good)",
  C: "50 - 59% (Good)",
  D: "45 - 49% (Fair)",
  E: "40 - 44% (Pass)",
  F: "0 - 39% (Fail)",
};

const PRESET_TEMPLATES: Record<string, Array<{ code: string; units: number; grade: "A" | "B" | "C" }>> = {
  "100L Sciences / Pre-Med": [
    { code: "MTH 101 (Calculus)", units: 3, grade: "A" },
    { code: "PHY 101 (Mechanics)", units: 3, grade: "A" },
    { code: "CHM 101 (General Chem)", units: 3, grade: "B" },
    { code: "BIO 101 (Cell Biology)", units: 3, grade: "A" },
    { code: "GST 101 (Use of English)", units: 2, grade: "A" },
    { code: "GST 103 (Philosophy)", units: 2, grade: "A" },
    { code: "PHY 107 (Practical)", units: 1, grade: "A" },
    { code: "CHM 107 (Practical)", units: 1, grade: "A" },
  ],
  "100L Engineering": [
    { code: "MTH 101 (Elementary Math I)", units: 4, grade: "A" },
    { code: "PHY 101 (General Physics I)", units: 3, grade: "A" },
    { code: "CHM 101 (General Chemistry I)", units: 3, grade: "B" },
    { code: "ENG 101 (Engineering Drawing)", units: 2, grade: "A" },
    { code: "CSC 101 (Intro to Computing)", units: 3, grade: "A" },
    { code: "GST 101 (Communication in English)", units: 2, grade: "A" },
    { code: "PHY 107 (Physics Practical)", units: 1, grade: "A" },
  ],
  "100L Management & Social Sciences": [
    { code: "ACC 101 (Financial Accounting I)", units: 3, grade: "A" },
    { code: "ECO 101 (Intro to Economics)", units: 3, grade: "A" },
    { code: "BUS 101 (Intro to Business)", units: 3, grade: "A" },
    { code: "MTH 105 (Maths for Social Sciences)", units: 3, grade: "B" },
    { code: "GST 101 (Use of English)", units: 2, grade: "A" },
    { code: "GST 105 (Citizenship Education)", units: 2, grade: "A" },
    { code: "CSC 101 (Computer Applications)", units: 2, grade: "A" },
  ],
};

function getDegreeClass(cgpa: number): { title: string; color: string; badge: string; icon: string } {
  if (cgpa >= 4.50) {
    return {
      title: "First Class Honours",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      badge: "bg-emerald-500 text-black font-extrabold",
      icon: "🏆",
    };
  }
  if (cgpa >= 3.50) {
    return {
      title: "Second Class Upper (2:1)",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      badge: "bg-blue-500 text-white font-extrabold",
      icon: "🥈",
    };
  }
  if (cgpa >= 2.40) {
    return {
      title: "Second Class Lower (2:2)",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      badge: "bg-amber-500 text-black font-extrabold",
      icon: "🥉",
    };
  }
  if (cgpa >= 1.50) {
    return {
      title: "Third Class Division",
      color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
      badge: "bg-orange-500 text-white font-extrabold",
      icon: "📜",
    };
  }
  return {
    title: "Academic Probation Warning",
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    badge: "bg-rose-500 text-white font-extrabold",
    icon: "⚠️",
  };
}

export default function CgpaCalculatorPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [courses, setCourses] = useState<CourseRow[]>([
    { id: "1", code: "MTH 101", units: 3, grade: "A" },
    { id: "2", code: "PHY 101", units: 3, grade: "B" },
    { id: "3", code: "CHM 101", units: 3, grade: "A" },
    { id: "4", code: "GST 101", units: 2, grade: "A" },
    { id: "5", code: "CSC 101", units: 2, grade: "A" },
  ]);

  const [includePrevious, setIncludePrevious] = useState(false);
  const [prevCgpa, setPrevCgpa] = useState<string>("4.20");
  const [prevUnits, setPrevUnits] = useState<string>("36");
  const [targetGoal, setTargetGoal] = useState<number>(4.50);

  // Add course row
  const addCourse = () => {
    setCourses(prev => [
      ...prev,
      { id: Date.now().toString(), code: "", units: 3, grade: "A" },
    ]);
  };

  const removeCourse = (id: string) => {
    if (courses.length <= 1) {
      toast({ title: "Keep at least one course", description: "You need at least one course to compute GPA." });
      return;
    }
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof CourseRow, value: any) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const loadTemplate = (key: string) => {
    const template = PRESET_TEMPLATES[key];
    if (!template) return;
    setCourses(template.map((t, idx) => ({
      id: `${Date.now()}-${idx}`,
      code: t.code,
      units: t.units,
      grade: t.grade,
    })));
    toast({ title: `Loaded ${key}`, description: `${template.length} sample courses added to your sheet.` });
  };

  const resetCourses = () => {
    setCourses([
      { id: "1", code: "MTH 101", units: 3, grade: "A" },
      { id: "2", code: "PHY 101", units: 3, grade: "A" },
      { id: "3", code: "GST 101", units: 2, grade: "A" },
    ]);
    toast({ title: "Reset complete", description: "Cleared course table." });
  };

  // Calculations
  const semesterCalculations = useMemo(() => {
    let totalUnits = 0;
    let totalPoints = 0;

    courses.forEach(c => {
      const u = Number(c.units) || 0;
      const pts = (GRADE_POINTS[c.grade] ?? 0) * u;
      totalUnits += u;
      totalPoints += pts;
    });

    const gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;

    let cumulativeGpa = gpa;
    let cumulativeUnits = totalUnits;
    let cumulativePoints = totalPoints;

    if (includePrevious) {
      const parsedPrevCgpa = parseFloat(prevCgpa) || 0;
      const parsedPrevUnits = parseFloat(prevUnits) || 0;
      const prevPoints = parsedPrevCgpa * parsedPrevUnits;

      cumulativeUnits = totalUnits + parsedPrevUnits;
      cumulativePoints = totalPoints + prevPoints;
      cumulativeGpa = cumulativeUnits > 0 ? cumulativePoints / cumulativeUnits : 0;
    }

    return {
      semesterUnits: totalUnits,
      semesterPoints: totalPoints,
      semesterGpa: Number(gpa.toFixed(2)),
      cumulativeUnits,
      cumulativePoints,
      cumulativeGpa: Number(cumulativeGpa.toFixed(2)),
    };
  }, [courses, includePrevious, prevCgpa, prevUnits]);

  // Target GPA Gap Analysis
  const targetGapAnalysis = useMemo(() => {
    const currentCgpa = semesterCalculations.cumulativeGpa;
    const diff = Number((targetGoal - currentCgpa).toFixed(2));
    if (diff <= 0) {
      return {
        status: "achieved",
        message: `🎉 Outstanding! Your projected CGPA (${currentCgpa.toFixed(2)}) meets or surpasses your goal of ${targetGoal.toFixed(2)}!`,
      };
    }
    return {
      status: "needed",
      message: `You are currently ${diff} points shy of ${targetGoal.toFixed(2)}. Upgrading 1 or 2 grades from B/C to A will push your CGPA across the finish line!`,
    };
  }, [semesterCalculations, targetGoal]);

  // Identify courses where tutor support could elevate grade
  const struggleCourses = courses.filter(c => ["C", "D", "E", "F"].includes(c.grade));

  const degreeClass = getDegreeClass(semesterCalculations.cumulativeGpa);

  const handleShareWhatsApp = () => {
    const msg =
      `📊 *My University CGPA Projection (Nigerian 5.0 Scale)*\n\n` +
      `🎯 *Projected CGPA:* ${semesterCalculations.cumulativeGpa.toFixed(2)} / 5.00\n` +
      `🎓 *Degree Class:* ${degreeClass.icon} ${degreeClass.title}\n` +
      `📚 *Total Credit Units:* ${semesterCalculations.cumulativeUnits} Units\n` +
      `⚡ *Semester GPA:* ${semesterCalculations.semesterGpa.toFixed(2)}\n\n` +
      `Calculate your CGPA & target grade planner free on 2torConnect:\n` +
      `👉 https://www.2torconnect.com/cgpa-calculator`;

    window.open(getWhatsAppUrl(msg), "_blank");
  };

  const content = (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 bg-gradient-to-r from-primary/10 via-background to-accent/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                Nigerian 5.0 Scale System
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-muted-foreground">
                NUC Standard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <Calculator className="w-8 h-8 text-accent" /> 5.0 CGPA & Target Grade Planner
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Track your semester GPA, calculate cumulative CGPA across UNILAG, ABU, UNN, UI, OAU, LASU, and Covenant, and simulate target grades to graduate with First Class Honours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="w-4 h-4" /> Share to WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-all"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cumulative CGPA Card */}
        <div className={`glass-panel rounded-3xl p-6 border ${degreeClass.color} flex flex-col justify-between relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-6 text-5xl opacity-20 pointer-events-none">
            {degreeClass.icon}
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {includePrevious ? "Cumulative CGPA (Overall)" : "Current Semester GPA"}
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tight">
                {semesterCalculations.cumulativeGpa.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground font-semibold">/ 5.00</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Class of Degree:</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${degreeClass.badge}`}>
                {degreeClass.icon} {degreeClass.title}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Units: {semesterCalculations.cumulativeUnits}</span>
              <span>Total Points: {semesterCalculations.cumulativePoints}</span>
            </div>
          </div>
        </div>

        {/* Semester GPA Stats */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">This Semester Breakdown</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-accent">
                {semesterCalculations.semesterGpa.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground font-medium">Semester GPA</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/5 text-center">
              <p className="text-[11px] text-muted-foreground">Courses Registered</p>
              <p className="text-lg font-bold text-white mt-0.5">{courses.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 text-center">
              <p className="text-[11px] text-muted-foreground">Semester Units (TNU)</p>
              <p className="text-lg font-bold text-accent mt-0.5">{semesterCalculations.semesterUnits}</p>
            </div>
          </div>
        </div>

        {/* Target Grade Goal Simulator */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Target Degree Goal</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>

            <div className="mt-3 flex gap-2">
              {[
                { label: "1st Class (4.50)", val: 4.50 },
                { label: "2:1 (3.50)", val: 3.50 },
                { label: "5.00 Star", val: 5.00 },
              ].map(t => (
                <button
                  key={t.val}
                  onClick={() => setTargetGoal(t.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    targetGoal === t.val
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {targetGapAnalysis.message}
            </p>
          </div>
        </div>
      </div>

      {/* Previous Semesters Toggle Accordion */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Include Previous Semesters (Cumulative CGPA)</h3>
              <p className="text-xs text-muted-foreground">Add your past units and CGPA to calculate your real overall graduating standing</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includePrevious}
              onChange={(e) => setIncludePrevious(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {includePrevious && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Current Cumulative CGPA (Before This Semester)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.00"
                value={prevCgpa}
                onChange={(e) => setPrevCgpa(e.target.value)}
                placeholder="e.g. 4.15"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Total Units Passed / Completed So Far
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={prevUnits}
                onChange={(e) => setPrevUnits(e.target.value)}
                placeholder="e.g. 36"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Course List & Grading Sheet */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" /> Semester Course Registration & Grades
            </h2>
            <p className="text-xs text-muted-foreground">Set course units (1–6) and your targeted or scored grade</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template drop-in */}
            <span className="text-xs text-muted-foreground mr-1">Load Preset:</span>
            {Object.keys(PRESET_TEMPLATES).map(key => (
              <button
                key={key}
                onClick={() => loadTemplate(key)}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors"
              >
                {key.split(" ")[1] || key}
              </button>
            ))}
            <button
              onClick={resetCourses}
              title="Reset Table"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors ml-1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table of courses */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 hidden sm:grid">
            <div className="col-span-5">Course Code / Title</div>
            <div className="col-span-3 text-center">Credit Units</div>
            <div className="col-span-3 text-center">Grade (Points)</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {courses.map((course, index) => (
            <div
              key={course.id}
              className="grid grid-cols-12 gap-2.5 sm:gap-3 items-center p-3 sm:p-3.5 rounded-2xl bg-black/30 border border-white/5 hover:border-white/15 transition-all"
            >
              {/* Course code */}
              <div className="col-span-10 sm:col-span-5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 sm:w-5 font-mono">{index + 1}.</span>
                <input
                  type="text"
                  value={course.code}
                  onChange={(e) => updateCourse(course.id, "code", e.target.value)}
                  placeholder="e.g. MTH 101 or Physics"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:border-accent focus:outline-none"
                />
              </div>

              {/* Remove button */}
              <div className="col-span-2 sm:col-span-1 order-2 sm:order-4 flex justify-end">
                <button
                  onClick={() => removeCourse(course.id)}
                  className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Remove Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Credit Units */}
              <div className="col-span-6 sm:col-span-3 order-3 sm:order-2 flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="sm:hidden text-[11px] text-muted-foreground shrink-0">Units:</span>
                <select
                  value={course.units}
                  onChange={(e) => updateCourse(course.id, "units", Number(e.target.value))}
                  className="w-full sm:w-28 px-2 sm:px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs sm:text-sm focus:border-accent focus:outline-none text-center font-bold"
                >
                  {[1, 2, 3, 4, 5, 6].map(u => (
                    <option key={u} value={u}>{u} {u === 1 ? "Unit" : "Units"}</option>
                  ))}
                </select>
              </div>

              {/* Grade Selector */}
              <div className="col-span-6 sm:col-span-3 order-4 sm:order-3 flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="sm:hidden text-[11px] text-muted-foreground shrink-0">Grade:</span>
                <select
                  value={course.grade}
                  onChange={(e) => updateCourse(course.id, "grade", e.target.value as any)}
                  className={`w-full sm:w-32 px-2 sm:px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold text-center focus:outline-none ${
                    course.grade === "A"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : course.grade === "B"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      : course.grade === "C"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                >
                  <option value="A" className="bg-zinc-900 text-emerald-400">A (5 Pts)</option>
                  <option value="B" className="bg-zinc-900 text-blue-400">B (4 Pts)</option>
                  <option value="C" className="bg-zinc-900 text-amber-400">C (3 Pts)</option>
                  <option value="D" className="bg-zinc-900 text-orange-400">D (2 Pts)</option>
                  <option value="E" className="bg-zinc-900 text-rose-300">E (1 Pt)</option>
                  <option value="F" className="bg-zinc-900 text-rose-500">F (0 Pts)</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Add Course button */}
        <div className="pt-2">
          <button
            onClick={addCourse}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-dashed border-white/20 transition-all hover:border-accent hover:text-accent w-full justify-center"
          >
            <Plus className="w-4 h-4" /> Add Another Course
          </button>
        </div>
      </div>

      {/* Smart Tutor Recommendations for Lower Grades */}
      {struggleCourses.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-accent/20 bg-gradient-to-r from-accent/10 via-background to-purple-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="text-white font-bold text-base">
                  Boost Your Grades to an "A" with a Verified Tutor
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                You have {struggleCourses.length} course(s) ({struggleCourses.map(c => c.code || "Course").join(", ")}) rated below an A. Our campus tutors specialize in turning C's and B's into 5.0 First Class grades!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/past-questions"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                CBT Mock Test
              </Link>
              <Link
                href="/student/find-tutor"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
              >
                Find Tutor for This Course <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Grading Scale Reference Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-accent" /> Official Nigerian University Grading Standard (NUC 5.0)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(GRADE_POINTS).map(([grade, pts]) => (
            <div key={grade} className="p-3 rounded-2xl bg-black/30 border border-white/5 text-center">
              <span className={`inline-block px-2.5 py-0.5 rounded-lg text-sm font-black mb-1 ${
                grade === "A" ? "bg-emerald-500/20 text-emerald-400" :
                grade === "B" ? "bg-blue-500/20 text-blue-400" :
                grade === "C" ? "bg-amber-500/20 text-amber-400" :
                grade === "D" ? "bg-orange-500/20 text-orange-400" :
                "bg-rose-500/20 text-rose-400"
              }`}>
                Grade {grade}
              </span>
              <p className="text-xs font-bold text-white mt-1">{pts} Points</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{GRADE_DESCRIPTIONS[grade]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // If user is logged in, wrap in DashboardLayout
  if (user) {
    return (
      <DashboardLayout title="5.0 CGPA & Target Grade Planner">
        {content}
      </DashboardLayout>
    );
  }

  // Public wrapper for non-logged in visitors from WhatsApp
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              2torConnect
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-white font-medium">
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 transition-all"
            >
              Join 2torConnect
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        {content}
      </main>
    </div>
  );
}

