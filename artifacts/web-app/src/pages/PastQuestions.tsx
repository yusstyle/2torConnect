import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  GraduationCap, BookOpen, Clock, CheckCircle2, XCircle, Search,
  Award, Play, RotateCcw, Share2, Sparkles, Filter, ChevronRight,
  ExternalLink, UserCheck, HelpCircle, ArrowLeft, ArrowRight
} from "lucide-react";
import { sharePastQuestionsToWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Question {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

interface CoursePQ {
  code: string;
  title: string;
  category: string;
  level: string;
  universities: string[];
  year: string;
  durationMinutes: number;
  questionsCount: number;
}

export default function PastQuestionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [courses, setCourses] = useState<CoursePQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  // Active course study / CBT test state
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [courseQuestions, setCourseQuestions] = useState<Question[]>([]);
  const [activeMode, setActiveMode] = useState<"study" | "cbt" | null>(null);

  // CBT test state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testResult, setTestResult] = useState<any | null>(null);

  const role = user?.role ?? "student";

  // Fetch courses list
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/past-questions");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.warn("Failed to load past questions", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  // Timer countdown for CBT
  useEffect(() => {
    if (activeMode !== "cbt" || testResult || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMode, testResult, timeLeft]);

  const startTest = async (courseCode: string, mode: "study" | "cbt") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/past-questions/${courseCode}`);
      if (!res.ok) throw new Error("Could not load course questions");
      const data = await res.json();
      setCourseQuestions(data.questions || []);
      setActiveCourse(courseCode);
      setActiveMode(mode);
      setCurrentIdx(0);
      setUserAnswers({});
      setTestResult(null);
      if (mode === "cbt") {
        setTimeLeft((data.durationMinutes || 15) * 60);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, key: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const handleSubmitTest = async () => {
    if (!activeCourse) return;
    try {
      const res = await fetch(`/api/past-questions/${activeCourse}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: userAnswers }),
      });
      if (res.ok) {
        const result = await res.json();
        setTestResult(result);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to submit test" });
    }
  };

  const exitMode = () => {
    setActiveMode(null);
    setActiveCourse(null);
    setTestResult(null);
  };

  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.universities.some((u) => u.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === "all" || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchLevel = selectedLevel === "all" || c.level.toLowerCase() === selectedLevel.toLowerCase();
    return matchSearch && matchCat && matchLevel;
  });

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <DashboardLayout role={role} title="Past Questions & CBT Practice">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-cyan-950/40 via-background to-purple-950/40 border border-cyan-500/20 glass-panel">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <GraduationCap className="w-3.5 h-3.5" /> University Past Questions & CBT Bank
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Exam Past Questions & Timed CBT Mock Tests
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Master 100L–300L semester exams across UNILAG, ABU, UNN, OAU, UI, and BUK. Practice timed CBT mock tests, view step-by-step solutions, and connect with top tutors for one-on-one exam coaching.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/student/find-tutor"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <UserCheck className="w-4 h-4" /> Book an Exam Prep Tutor
              </Link>
            </div>
          </div>
        </div>

        {/* View 1: Active CBT Test Mode */}
        {activeMode === "cbt" && !testResult && courseQuestions.length > 0 && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            {/* CBT Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={exitMode}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeCourse} CBT Mock Exam
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                      Question {currentIdx + 1} of {courseQuestions.length}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Select your answer and navigate using the controls below.</p>
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-base ${
                timeLeft < 180
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                  : "bg-white/5 border-white/10 text-emerald-400"
              }`}>
                <Clock className="w-4 h-4" />
                {formatTimer(timeLeft)}
              </div>
            </div>

            {/* Current Question */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent mb-2 block">
                  Question {currentIdx + 1}
                </span>
                <p className="text-base md:text-lg font-medium text-white leading-relaxed">
                  {courseQuestions[currentIdx]?.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {courseQuestions[currentIdx]?.options.map((opt) => {
                  const isSelected = userAnswers[courseQuestions[currentIdx].id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectAnswer(courseQuestions[currentIdx].id, opt.key)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                        isSelected
                          ? "bg-accent/20 border-accent text-white shadow-md shadow-accent/10"
                          : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                        isSelected ? "bg-accent text-black font-extrabold" : "bg-white/10 text-muted-foreground"
                      }`}>
                        {opt.key}
                      </span>
                      <span className="text-sm font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Question Navigation Palette */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
                <span className="text-xs text-muted-foreground mr-2">Jump to:</span>
                {courseQuestions.map((q, idx) => {
                  const answered = Boolean(userAnswers[q.id]);
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? "ring-2 ring-accent bg-accent text-black"
                          : answered
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold disabled:opacity-30"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>

                {currentIdx === courseQuestions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIdx((p) => Math.min(courseQuestions.length - 1, p + 1))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:opacity-90"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View 2: Test Result & Detailed Scorecard */}
        {testResult && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="text-center space-y-3 py-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Award className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                Grade: <span className="text-emerald-400">{testResult.grade}</span> ({testResult.percentage}%)
              </h2>
              <p className="text-base text-white/90 font-medium">{testResult.remark}</p>
              <p className="text-xs text-muted-foreground">
                You correctly answered {testResult.score} out of {testResult.total} questions for {testResult.courseCode}.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <button
                  onClick={() => startTest(testResult.courseCode, "cbt")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Test
                </button>
                <Link
                  href="/student/find-tutor"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-md"
                >
                  <UserCheck className="w-4 h-4" /> Book a Tutor for {testResult.courseCode}
                </Link>
                <button
                  onClick={() => sharePastQuestionsToWhatsApp(testResult.courseCode, "2torConnect Past Questions")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all"
                >
                  <Share2 className="w-4 h-4" /> Share Score to WhatsApp
                </button>
              </div>
            </div>

            {/* Answer Review */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" /> Question Review & Explanations
              </h3>
              <div className="space-y-4">
                {testResult.review?.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border ${
                      item.isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-rose-950/20 border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Q{idx + 1}.</span>
                          <span className="text-sm font-semibold text-white">{item.question}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs font-mono">
                          <span className={item.isCorrect ? "text-emerald-400" : "text-rose-400"}>
                            Your Answer: {item.selectedAnswer || "None"}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            Correct: {item.correctAnswer}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed">
                          <strong className="text-white">Explanation: </strong>
                          {item.explanation}
                        </div>
                      </div>
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View 3: Study Mode (Direct Solutions) */}
        {activeMode === "study" && courseQuestions.length > 0 && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={exitMode}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white">{activeCourse} Solved Past Questions</h2>
                  <p className="text-xs text-muted-foreground">Review step-by-step solutions with detailed working.</p>
                </div>
              </div>
              <button
                onClick={() => startTest(activeCourse!, "cbt")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs"
              >
                <Play className="w-3.5 h-3.5" /> Practice as Timed CBT
              </button>
            </div>

            <div className="space-y-6">
              {courseQuestions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent">Question {idx + 1}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Answer: {q.correctAnswer}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                          opt.key === q.correctAnswer
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold"
                            : "bg-white/5 border-white/5 text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold">{opt.key}.</span> {opt.text}
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground leading-relaxed mt-2">
                    <span className="text-accent font-semibold block mb-1">Step-by-step Solution:</span>
                    {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 4: Course Browser & Filter Hub */}
        {!activeMode && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by course code, title (e.g. MTH 101), or university..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent text-sm"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none"
                >
                  <option value="all">All Disciplines</option>
                  <option value="Science">Sciences</option>
                  <option value="General">General Studies (GST)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Management">Management</option>
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                </select>
              </div>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredCourses.map((c) => (
                <div
                  key={c.code}
                  className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-accent/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 border border-accent/40 text-accent font-extrabold text-sm tracking-wide">
                        {c.code}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                        {c.level} • {c.year}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        Universities: {c.universities.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-accent" /> {c.questionsCount} Solved Questions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> {c.durationMinutes} Mins CBT Test
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => startTest(c.code, "cbt")}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 shadow-md transition-all"
                    >
                      <Play className="w-3.5 h-3.5" /> Start CBT Mock
                    </button>
                    <button
                      onClick={() => startTest(c.code, "study")}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> View Solutions
                    </button>
                    <button
                      onClick={() => sharePastQuestionsToWhatsApp(c.code, c.title)}
                      className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all"
                      title="Share to Course WhatsApp Group"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-16 glass-panel rounded-3xl border border-white/10">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-white font-bold">No past questions matched your filter</p>
                <p className="text-xs text-muted-foreground mt-1">Try searching another course code (e.g. MTH101, PHY101, GST101, CSC101).</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

