import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  GraduationCap, BookOpen, Clock, CheckCircle2, XCircle, Search,
  Award, Play, RotateCcw, Share2, Sparkles, Filter, ChevronRight,
  ExternalLink, UserCheck, HelpCircle, ArrowLeft, ArrowRight,
  Camera, Upload, Zap, FileText, Layers, Check, Loader2, RefreshCw
} from "lucide-react";
import { sharePastQuestionsToWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { getApiUrl } from "@/lib/api";
import {
  DEFAULT_COURSES_BANK,
  DEFAULT_QUESTIONS_MAP,
  gradeExamLocally,
  type Question,
  type CoursePQ
} from "@/lib/past-questions-data";

export default function PastQuestionsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"bank" | "generator" | "scanner">("bank");
  const [courses, setCourses] = useState<CoursePQ[]>(DEFAULT_COURSES_BANK);
  const [loading, setLoading] = useState(false);
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

  // AI Generator state
  const [genCourseCode, setGenCourseCode] = useState("MTH 101");
  const [genTopic, setGenTopic] = useState("Calculus, Differentiation & Integration");
  const [genExamType, setGenExamType] = useState("University 100L");
  const [genLevel, setGenLevel] = useState("100L");
  const [genUniversity, setGenUniversity] = useState("University of Lagos (UNILAG)");
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  // AI Scanner state
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanCourseCode, setScanCourseCode] = useState("PHY 101");
  const [scanUniversity, setScanUniversity] = useState("University Campus");
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "student";

  // Fetch courses list with local fallback preservation
  const loadCourses = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/past-questions`);
      if (res.ok) {
        const data = await res.json();
        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          // Merge server courses with default bank so nothing is lost
          const existingCodes = new Set(data.courses.map((c: any) => c.code));
          const uniqueDefaults = DEFAULT_COURSES_BANK.filter((d) => !existingCodes.has(d.code));
          setCourses([...data.courses, ...uniqueDefaults]);
        }
      }
    } catch (err) {
      console.warn("Using offline/local past questions bank", err);
    }
  };

  useEffect(() => {
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
    // Instant fallback check so user never waits or sees blank
    const localQuestions = DEFAULT_QUESTIONS_MAP[courseCode] || DEFAULT_QUESTIONS_MAP["MTH101"];

    try {
      const res = await fetch(`${getApiUrl()}/past-questions/${courseCode}`);
      if (res.ok) {
        const data = await res.json();
        setCourseQuestions(data.questions || localQuestions);
        setActiveCourse(courseCode);
        setActiveMode(mode);
        setCurrentIdx(0);
        setUserAnswers({});
        setTestResult(null);
        if (mode === "cbt") {
          setTimeLeft((data.durationMinutes || 15) * 60);
        }
        return;
      }
    } catch (e: any) {
      console.warn("Using local questions for", courseCode);
    } finally {
      setLoading(false);
    }

    // Local execution fallback
    if (localQuestions) {
      setCourseQuestions(localQuestions);
      setActiveCourse(courseCode);
      setActiveMode(mode);
      setCurrentIdx(0);
      setUserAnswers({});
      setTestResult(null);
      if (mode === "cbt") {
        setTimeLeft(15 * 60);
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: "Questions loading failed." });
    }
  };

  const handleSelectAnswer = (questionId: number, key: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const handleSubmitTest = async () => {
    if (!activeCourse) return;
    const timeSpent = Math.max(1, 900 - timeLeft);

    try {
      const res = await fetch(`${getApiUrl()}/past-questions/${activeCourse}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: userAnswers, timeSpentSeconds: timeSpent }),
      });
      if (res.ok) {
        const result = await res.json();
        setTestResult(result);
        return;
      }
    } catch (err) {
      console.warn("Grading exam locally...");
    }

    // Client-side instant grading fallback
    const localResult = gradeExamLocally(activeCourse, courseQuestions, userAnswers, timeSpent);
    setTestResult(localResult);
  };

  const exitMode = () => {
    setActiveMode(null);
    setActiveCourse(null);
    setTestResult(null);
  };

  // Handle AI Infinite Generator Submission
  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genCourseCode.trim()) {
      toast({ variant: "destructive", title: "Please enter a course code" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${getApiUrl()}/past-questions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: genCourseCode,
          topic: genTopic,
          examType: genExamType,
          level: genLevel,
          count: genCount,
          university: genUniversity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.course?.code) {
        toast({
          title: "Exam Generated! ⚡",
          description: `Created ${data.course.questionsCount} CBT questions for ${data.course.title}`,
        });
        await loadCourses();
        startTest(data.course.code, "cbt");
      } else {
        throw new Error(data.error || "Failed to generate mock test");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  // Handle Image File Selection for Scanner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image too large", description: "Please upload an image under 5MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setScanImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Scanner Submission
  const handleScanPaper = async () => {
    if (!scanImage) {
      toast({ variant: "destructive", title: "No image selected", description: "Please upload or capture a photo of the exam paper." });
      return;
    }
    setScanning(true);
    try {
      const res = await fetch(`${getApiUrl()}/past-questions/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: scanImage,
          courseCode: scanCourseCode,
          university: scanUniversity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.course?.code) {
        toast({
          title: "Exam Paper Digitized! 📸",
          description: `Extracted questions and ready to practice!`,
        });
        await loadCourses();
        startTest(data.course.code, "cbt");
      } else {
        throw new Error(data.error || "Failed to scan exam paper");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Scanner Error", description: err.message });
    } finally {
      setScanning(false);
    }
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
        {/* Banner with 1,000,000+ Questions Counter */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-cyan-950/40 via-background to-purple-950/40 border border-cyan-500/20 glass-panel">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> JAMB, Post-UTME & University Past Questions Bank
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                National & University Past Questions Hub
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                JAMB UTME, WAEC, Post-UTME (UNILAG, UI, OAU, ABU, UNN), and 100L–400L university semester exam questions. Practice timed CBT mocks, create custom practice quizzes for your courses, or snap photos of physical past papers to solve them directly.
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

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-[11px] text-muted-foreground">Solved Questions</p>
              <p className="text-base font-bold text-cyan-400 mt-0.5">5,000+ Practice Items</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-[11px] text-muted-foreground">National Boards</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">JAMB • WAEC • NECO</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-[11px] text-muted-foreground">Universities Covered</p>
              <p className="text-base font-bold text-accent mt-0.5">UNILAG • UI • OAU • ABU</p>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-[11px] text-muted-foreground">Custom Quiz Builder</p>
              <p className="text-base font-bold text-purple-400 mt-0.5">Any Course On-Demand</p>
            </div>
          </div>
        </div>

        {/* View 1: Active CBT Test Mode */}
        {activeMode === "cbt" && !testResult && courseQuestions.length > 0 && (
          <div className="glass-panel rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-white/10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  onClick={exitMode}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                    {activeCourse} CBT Mock
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                      Q {currentIdx + 1}/{courseQuestions.length}
                    </span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Select your answer and navigate below.</p>
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border font-mono font-bold text-sm sm:text-base ${
                timeLeft < 180
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                  : "bg-white/5 border-white/10 text-emerald-400"
              }`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {formatTimer(timeLeft)}
              </div>
            </div>

            {/* Current Question */}
            <div className="space-y-5 sm:space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-accent mb-2 block">
                  Question {currentIdx + 1}
                </span>
                <p className="text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed">
                  {courseQuestions[currentIdx]?.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 sm:space-y-3">
                {courseQuestions[currentIdx]?.options.map((opt) => {
                  const isSelected = userAnswers[courseQuestions[currentIdx].id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectAnswer(courseQuestions[currentIdx].id, opt.key)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center gap-3 sm:gap-4 ${
                        isSelected
                          ? "bg-accent/20 border-accent text-white shadow-md shadow-accent/10"
                          : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 ${
                        isSelected ? "bg-accent text-black font-extrabold" : "bg-white/10 text-muted-foreground"
                      }`}>
                        {opt.key}
                      </span>
                      <span className="text-xs sm:text-sm font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-white/10">
                <button
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Prev
                </button>

                {/* Question Jumper */}
                <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-none overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap py-1">
                  {courseQuestions.map((_, idx) => {
                    const answered = !!userAnswers[courseQuestions[idx]?.id];
                    const isCurrent = idx === currentIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isCurrent
                            ? "bg-accent text-black ring-2 ring-accent/50 scale-105"
                            : answered
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {currentIdx < courseQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((prev) => Math.min(courseQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitTest}
                    className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs hover:opacity-90 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View 2: Test Result & Review */}
        {testResult && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10 text-center sm:text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Exam Completed</span>
                <h2 className="text-2xl font-black text-white mt-1">{testResult.courseCode} Result</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{testResult.remark}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => startTest(activeCourse!, "cbt")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Test
                </button>
                <button
                  onClick={exitMode}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Back to Hub
                </button>
              </div>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-2xl font-black text-white mt-1">
                  {testResult.score} / {testResult.total}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground">Percentage</p>
                <p className={`text-2xl font-black mt-1 ${testResult.percentage >= 60 ? "text-emerald-400" : "text-amber-400"}`}>
                  {testResult.percentage}%
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground">Letter Grade</p>
                <p className={`text-2xl font-black mt-1 ${
                  testResult.grade === "A" ? "text-emerald-400" :
                  testResult.grade === "B" ? "text-blue-400" :
                  testResult.grade === "C" ? "text-amber-400" : "text-rose-400"
                }`}>
                  Grade {testResult.grade}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground">Time Taken</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">
                  {Math.round(testResult.timeSpentSeconds / 60)}m {testResult.timeSpentSeconds % 60}s
                </p>
              </div>
            </div>

            {/* Answer Explanations Review */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-white">Question by Question Review</h3>
              {testResult.review.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border ${
                    item.isCorrect
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-rose-950/20 border-rose-500/30"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Question {idx + 1}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.isCorrect
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {item.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {item.isCorrect ? "Correct" : `Incorrect (Your answer: ${item.selectedAnswer || "None"})`}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-white">{item.question}</p>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-muted-foreground space-y-1">
                    <p className="text-emerald-400 font-semibold">Correct Answer: {item.correctAnswer}</p>
                    <p className="leading-relaxed">{item.explanation}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Book Tutor Callout */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/20 via-background to-accent/20 border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-base font-bold text-white">Need 1-on-1 Exam Coaching in {testResult.courseCode}?</h4>
                <p className="text-xs text-muted-foreground">Book top peer tutors from your university who aced this exact course with an A.</p>
              </div>
              <Link
                href={`/student/find-tutor?subject=${testResult.courseCode}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 shadow-md whitespace-nowrap"
              >
                Find Tutor for This Course
              </Link>
            </div>
          </div>
        )}

        {/* View 3: Solved Study Mode */}
        {activeMode === "study" && (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
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

        {/* View 4: Main Explorer with 3 Tabs */}
        {!activeMode && (
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab("bank")}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === "bank"
                    ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Past Questions Bank ({filteredCourses.length})
              </button>

              <button
                onClick={() => setActiveTab("generator")}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === "generator"
                    ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" /> Practice Test Builder
              </button>

              <button
                onClick={() => setActiveTab("scanner")}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === "scanner"
                    ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-400" /> Photo Exam Paper Scanner
              </button>
            </div>

            {/* TAB 1: Core Bank */}
            {activeTab === "bank" && (
              <div className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search JAMB, Post-UTME, course code (e.g. MTH101), or university..."
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
                      <option value="JAMB">JAMB UTME</option>
                      <option value="Post-UTME">Post-UTME Screenings</option>
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
                      <option value="UTME/SSCE">JAMB / UTME / SSCE</option>
                      <option value="Post-UTME">Post-UTME</option>
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
                          <div className="flex items-center gap-2">
                            {c.isAiGenerated && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                                Custom Practice Set
                              </span>
                            )}
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                              {c.level} • {c.year}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors">
                            {c.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {c.universities.join(", ")}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      You can instantly build practice questions for this exam using the <strong>Practice Test Builder</strong> tab above!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Practice Test Builder */}
            {activeTab === "generator" && (
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                    <Zap className="w-3.5 h-3.5" /> Build a Custom Practice Quiz
                  </div>
                  <h2 className="text-xl font-bold text-white">Generate Practice Questions for Any Course or Topic</h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                    Need practice for a specific course or topic not yet in the bank? Enter your course code, topic, and university below to generate verified multiple-choice questions with step-by-step explanations.
                  </p>
                </div>

                <form onSubmit={handleGenerateExam} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Course Code / Exam Name
                    </label>
                    <input
                      type="text"
                      value={genCourseCode}
                      onChange={(e) => setGenCourseCode(e.target.value)}
                      placeholder="e.g. MTH 101, GST 102, JAMB Chemistry, or UNILAG Law"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Specific Exam Level / Category
                    </label>
                    <select
                      value={genExamType}
                      onChange={(e) => setGenExamType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                    >
                      <option value="University 100L">University 100 Level</option>
                      <option value="University 200L">University 200 Level</option>
                      <option value="University 300L">University 300 Level</option>
                      <option value="University 400L">University 400 Level (Final Year)</option>
                      <option value="JAMB UTME">JAMB UTME</option>
                      <option value="Post-UTME">University Post-UTME Screening</option>
                      <option value="WAEC / SSCE">WAEC / WASSCE</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Target Topic / Syllabus Area
                    </label>
                    <input
                      type="text"
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      placeholder="e.g. Differentiation, Integration, Thermodynamics, Organic Chemistry, or Civil Procedure"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Target University / Institution
                    </label>
                    <input
                      type="text"
                      value={genUniversity}
                      onChange={(e) => setGenUniversity(e.target.value)}
                      placeholder="e.g. UNILAG, ABU, UNN, UI, OAU, LASU, Covenant"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Number of Questions to Generate
                    </label>
                    <select
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-accent focus:outline-none"
                    >
                      <option value={5}>5 Questions (Quick Quiz - 10 mins)</option>
                      <option value={10}>10 Questions (Standard Mock - 20 mins)</option>
                      <option value={15}>15 Questions (Full CBT Simulation - 30 mins)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Preparing Practice Questions & Explanations...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Create Practice Quiz & Start Test
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: Photo Exam Paper Scanner */}
            {activeTab === "scanner" && (
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                    <Camera className="w-3.5 h-3.5" /> Snap & Practice Past Exam Paper
                  </div>
                  <h2 className="text-xl font-bold text-white">Scan or Snap a Past Question Paper</h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                    Take a photo of any printed exam paper, departmental test, or textbook question. The scanner reads the questions, extracts the options, and converts them into an interactive practice quiz.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Upload area */}
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-3xl p-8 text-center cursor-pointer bg-black/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center min-h-[220px]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {scanImage ? (
                        <div className="space-y-2">
                          <img
                            src={scanImage}
                            alt="Exam Paper Preview"
                            className="max-h-48 rounded-xl object-contain mx-auto shadow-lg border border-white/10"
                          />
                          <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Photo Loaded. Click to change.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-white">Click to Upload or Snap Exam Paper</p>
                          <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form metadata */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Course Code / Module
                      </label>
                      <input
                        type="text"
                        value={scanCourseCode}
                        onChange={(e) => setScanCourseCode(e.target.value)}
                        placeholder="e.g. PHY 101 or MTH 201"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        University / Department
                      </label>
                      <input
                        type="text"
                        value={scanUniversity}
                        onChange={(e) => setScanUniversity(e.target.value)}
                        placeholder="e.g. University of Lagos (UNILAG) Faculty of Science"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-muted-foreground leading-relaxed">
                      💡 <strong>Tip for best accuracy:</strong> Ensure the paper is well-lit and all question numbers and text are sharp and clear.
                    </div>

                    <button
                      onClick={handleScanPaper}
                      disabled={scanning || !scanImage}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Reading Paper & Extracting Questions...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Scan Paper & Launch CBT Quiz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
