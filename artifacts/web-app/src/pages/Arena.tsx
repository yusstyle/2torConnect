import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Trophy, Flame, Clock, CheckCircle2, XCircle,
  Share2, ArrowRight, Award, Sparkles, RefreshCw,
  GraduationCap, BookOpen, Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  course: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const DAILY_QUESTIONS: Question[] = [
  {
    id: 1,
    course: "MTH101 · Calculus",
    question: "Evaluate the limit: lim (x → 0) of [sin(3x) / x].",
    options: ["0", "1", "3", "Does not exist"],
    correct: 2,
    explanation: "Using the standard limit property lim (u → 0) [sin(u)/u] = 1, multiply and divide by 3: 3 · [sin(3x)/(3x)] = 3 · 1 = 3."
  },
  {
    id: 2,
    course: "GST101 · Use of English",
    question: "Identify the sentence with correct subject-verb concord:",
    options: [
      "Neither the lecturer nor the students was present.",
      "The committee has submitted their individual votes.",
      "One of the boys who is playing outside is my brother.",
      "Either the class rep or the tutors has the keys."
    ],
    correct: 2,
    explanation: "In 'One of the boys who is playing outside is my brother', the head subject 'One' correctly takes the singular verb 'is'. In option A, 'students' (plural near verb) requires 'were'."
  },
  {
    id: 3,
    course: "PHY101 · Mechanics",
    question: "A body of mass 4 kg moves with a constant velocity of 10 m/s. What is the net resultant force acting on it?",
    options: ["40 N", "0 N", "4 N", "400 N"],
    correct: 1,
    explanation: "By Newton's First Law of Motion, constant velocity implies zero acceleration (a = 0). Therefore F_net = m · a = 4 · 0 = 0 N."
  },
  {
    id: 4,
    course: "CHM101 · General Chemistry",
    question: "Which of the following molecules has a tetrahedral molecular geometry?",
    options: ["H2O", "NH3", "CH4", "CO2"],
    correct: 2,
    explanation: "Methane (CH4) has 4 bonding pairs and 0 lone pairs with sp3 hybridization, giving a symmetric tetrahedral shape with 109.5° bond angle."
  },
  {
    id: 5,
    course: "General Logic & Quantitative",
    question: "In a class of 60 students, 35 study Physics, 28 study Chemistry, and 12 study both. How many study neither?",
    options: ["5", "9", "15", "17"],
    correct: 1,
    explanation: "Total studying at least one = n(P) + n(C) - n(P ∩ C) = 35 + 28 - 12 = 51. Students studying neither = 60 - 51 = 9."
  }
];

const CAMPUS_RANKINGS = [
  { rank: 1, name: "University of Lagos (UNILAG)", points: 42800, players: 384 },
  { rank: 2, name: "University of Ibadan (UI)", points: 39500, players: 341 },
  { rank: 3, name: "Obafemi Awolowo University (OAU)", points: 36200, players: 310 },
  { rank: 4, name: "Federal University of Technology, Akure (FUTA)", points: 31900, players: 275 },
  { rank: 5, name: "University of Nigeria, Nsukka (UNN)", points: 28400, players: 240 },
  { rank: 6, name: "Ahmadu Bello University (ABU)", points: 24700, players: 215 },
  { rank: 7, name: "Covenant University (CU)", points: 22100, players: 198 },
  { rank: 8, name: "Lagos State University (LASU)", points: 19800, players: 182 },
];

export default function ArenaPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<"intro" | "playing" | "results">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(3);
  const [alreadyPlayedToday, setAlreadyPlayedToday] = useState(false);

  // Check saved streak
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastPlayed = localStorage.getItem("2tor_arena_last_played");
    const savedStreak = localStorage.getItem("2tor_arena_streak");

    if (savedStreak) setStreak(Number(savedStreak));
    if (lastPlayed === today) {
      setAlreadyPlayedToday(true);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing" || isAnswered) return;

    if (timeLeft <= 0) {
      handleOptionSelect(-1); // Timed out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, isAnswered]);

  const startQuiz = () => {
    setGameState("playing");
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setScore(0);
    setAnswers([]);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(index);

    const q = DAILY_QUESTIONS[currentIdx];
    const isCorrect = index === q.correct;

    if (isCorrect) {
      const speedBonus = Math.max(0, timeLeft * 2);
      setScore((prev) => prev + 20 + speedBonus);
    }

    setAnswers((prev) => [...prev, isCorrect]);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < DAILY_QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      // Completed
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem("2tor_arena_last_played", today);
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("2tor_arena_streak", String(newStreak));
      setAlreadyPlayedToday(true);
      setGameState("results");
    }
  };

  const shareScore = () => {
    const correctCount = answers.filter(Boolean).length;
    const text = `I just scored ${correctCount}/${DAILY_QUESTIONS.length} on today's 2torConnect daily revision quiz (Day ${streak} streak)! Test your knowledge here: https://www.2torconnect.com/arena`;
    if (navigator.share) {
      navigator.share({ title: "2torConnect Daily Quiz", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Link Copied!",
        description: "Quiz result copied to clipboard. Share in your course WhatsApp group!",
      });
    }
  };

  const correctCount = answers.filter(Boolean).length;
  const accuracyPct = Math.round((correctCount / DAILY_QUESTIONS.length) * 100);

  return (
    <DashboardLayout title="Daily Practice Quiz" role={user?.role as any}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

        {/* ── 1. Top Header Banner ── */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-card to-card shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>Daily Revision Quiz</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                5-Minute Daily Exam Practice
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                5 quick questions from university past papers and syllabus. Practice daily, maintain your streak, and earn discounts on tutor sessions.
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl shrink-0 w-full sm:w-auto justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xl sm:text-2xl font-black text-red-400">
                  <Flame className="w-5 h-5 fill-current text-red-500" />
                  {streak}
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Day Streak</p>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xl sm:text-2xl font-black text-emerald-400">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  5 Qs
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Timed Drill</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Today's Courses Tested Strip ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-muted-foreground text-xs font-semibold shrink-0">Today's Topics:</span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/90 shrink-0 font-medium">MTH101 (Calculus)</span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/90 shrink-0 font-medium">GST101 (English)</span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/90 shrink-0 font-medium">PHY101 (Mechanics)</span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/90 shrink-0 font-medium">CHM101 (Chemistry)</span>
          <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/90 shrink-0 font-medium">Quantitative Logic</span>
        </div>

        {/* ── 3. Intro State: Start Card + University Standings ── */}
        {gameState === "intro" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Start Card */}
            <div className="lg:col-span-2 glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Today's Practice Set</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Answer 5 multiple-choice questions covering core 100-level topics. You have <strong>15 seconds</strong> per question to practice exam timing. Step-by-step solutions are revealed after each answer.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Format</p>
                    <p className="text-xs sm:text-sm font-bold text-white mt-0.5">5 Questions</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Timer</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">15s / Question</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Target</p>
                    <p className="text-xs sm:text-sm font-bold text-cyan-400 mt-0.5">Exam Prep</p>
                  </div>
                </div>

                {streak >= 3 && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold">🔥 {streak}-Day Study Streak Active!</p>
                      <p className="text-[11px] text-emerald-300/80">Use promo code <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold text-white">CAMPUS10</code> for 10% off any tutor booking.</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={startQuiz}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                {alreadyPlayedToday ? "Practice Again" : "Start Today's Quiz (5 Questions)"}
              </button>
            </div>

            {/* University Leaderboard Widget */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    University Standings
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Students practicing on campus today
                </p>

                <div className="space-y-2">
                  {CAMPUS_RANKINGS.slice(0, 5).map((u) => (
                    <div key={u.rank} className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${
                          u.rank === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          u.rank === 2 ? "bg-slate-300/20 text-slate-300 border border-slate-300/40" :
                          u.rank === 3 ? "bg-amber-700/20 text-amber-400 border border-amber-700/40" :
                          "bg-white/5 text-muted-foreground"
                        }`}>
                          {u.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.players} students</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        {u.points.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 text-center text-[11px] text-muted-foreground">
                Your practice points help your university rank.
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Playing State ── */}
        {gameState === "playing" && (
          <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 max-w-2xl mx-auto space-y-5">
            {/* Header: Question Progress & Timer */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono font-bold text-muted-foreground">
                Question {currentIdx + 1} of {DAILY_QUESTIONS.length}
              </span>

              {/* Countdown timer badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${
                timeLeft <= 5 ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" : "bg-white/10 border-white/10 text-white"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>

              <div className="text-xs font-bold text-emerald-400">
                Score: {score} pts
              </div>
            </div>

            {/* Timer Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 5 ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                {DAILY_QUESTIONS[currentIdx].course}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-3 leading-relaxed">
                {DAILY_QUESTIONS[currentIdx].question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {DAILY_QUESTIONS[currentIdx].options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === DAILY_QUESTIONS[currentIdx].correct;

                let btnStyle = "bg-white/5 border-white/10 text-white hover:bg-white/10";
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold";
                  } else if (isSelected) {
                    btnStyle = "bg-red-500/20 border-red-500/50 text-red-300";
                  } else {
                    btnStyle = "bg-white/5 border-white/5 text-muted-foreground opacity-50";
                  }
                }

                const optionLetter = ["A", "B", "C", "D"][idx] || "";

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs sm:text-sm ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/10 text-white/80 font-bold text-xs flex items-center justify-center shrink-0">
                        {optionLetter}
                      </span>
                      <span>{option}</span>
                    </div>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation reveal */}
            {isAnswered && (
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl animate-in fade-in duration-300 space-y-2">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Explanation:
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {DAILY_QUESTIONS[currentIdx].explanation}
                </p>

                <button
                  onClick={nextQuestion}
                  className="mt-3 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <span>{currentIdx + 1 === DAILY_QUESTIONS.length ? "View Final Summary" : "Next Question"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 5. Results State ── */}
        {gameState === "results" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-lg mx-auto text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Revision Complete! 🎉</h2>
              <p className="text-xs text-muted-foreground mt-1">
                You've completed today's 5-question exam revision drill.
              </p>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-black/40 border border-white/10 rounded-2xl">
              <div>
                <p className="text-[10px] text-muted-foreground">Score</p>
                <p className="text-lg font-black text-emerald-400">{correctCount} / 5</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Accuracy</p>
                <p className="text-lg font-black text-cyan-400">{accuracyPct}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Streak</p>
                <p className="text-lg font-black text-red-400 flex items-center justify-center gap-0.5">
                  <Flame className="w-4 h-4 fill-current text-red-500" />
                  {streak}
                </p>
              </div>
            </div>

            {/* Streak Discount Perk */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-left flex items-center gap-3">
              <Award className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Daily Streak Reward Active</p>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">Use voucher code <strong className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">CAMPUS10</strong> to get 10% off your next session with a verified tutor.</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={shareScore}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share on WhatsApp
              </button>

              <button
                onClick={startQuiz}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Practice Again
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
