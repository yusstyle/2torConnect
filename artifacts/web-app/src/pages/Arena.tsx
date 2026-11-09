import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Trophy, Flame, Zap, Clock, CheckCircle2, XCircle,
  Share2, ArrowRight, Award, Sparkles, RefreshCw,
  GraduationCap, Medal, ShieldAlert, Heart
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
    question: "Evaluate the limit: lim (x -> 0) of [sin(3x) / x].",
    options: ["0", "1", "3", "Does not exist"],
    correct: 2,
    explanation: "Using the standard limit property lim (u -> 0) [sin(u)/u] = 1, we multiply and divide by 3: 3 * [sin(3x)/(3x)] = 3 * 1 = 3."
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
    explanation: "'One of the boys who are playing' or 'One of the boys who is...': Here 'who' refers to 'the boys' (plural), but 'One... is my brother' is singular. The correct rule of proximity: 'Neither the lecturer nor the students WERE present', so choice C maintains proper singular head agreement."
  },
  {
    id: 3,
    course: "PHY101 · Mechanics",
    question: "A body of mass 4 kg moves with a constant velocity of 10 m/s. What is the net resultant force acting on it?",
    options: ["40 N", "0 N", "4 N", "400 N"],
    correct: 1,
    explanation: "By Newton's First Law of Motion, if velocity is constant, acceleration a = 0. Therefore F_net = m * a = 4 * 0 = 0 N."
  },
  {
    id: 4,
    course: "CHM101 · General Chemistry",
    question: "Which of the following molecules has a tetrahedral molecular geometry?",
    options: ["H2O", "NH3", "CH4", "CO2"],
    correct: 2,
    explanation: "Methane (CH4) has 4 bonding pairs and 0 lone pairs with sp3 hybridization, giving an ideal tetrahedral geometry with 109.5° bond angle."
  },
  {
    id: 5,
    course: "General Logic & Quantitative",
    question: "In a class of 60 students, 35 study Physics, 28 study Chemistry, and 12 study both. How many study neither?",
    options: ["5", "9", "15", "17"],
    correct: 1,
    explanation: "Total studying at least one = n(P) + n(C) - n(P ∩ C) = 35 + 28 - 12 = 51. Those studying neither = 60 - 51 = 9."
  }
];

const CAMPUS_RANKINGS = [
  { rank: 1, name: "University of Lagos (UNILAG)", points: 42800, players: 384, badge: "🥇 1st Place" },
  { rank: 2, name: "University of Ibadan (UI)", points: 39500, players: 341, badge: "🥈 2nd Place" },
  { rank: 3, name: "Obafemi Awolowo University (OAU)", points: 36200, players: 310, badge: "🥉 3rd Place" },
  { rank: 4, name: "Federal University of Technology, Akure (FUTA)", points: 31900, players: 275, badge: "Top 5" },
  { rank: 5, name: "University of Nigeria, Nsukka (UNN)", points: 28400, players: 240, badge: "Top 5" },
  { rank: 6, name: "Ahmadu Bello University (ABU)", points: 24700, players: 215, badge: "Contender" },
  { rank: 7, name: "Covenant University (CU)", points: 22100, players: 198, badge: "Contender" },
  { rank: 8, name: "Lagos State University (LASU)", points: 19800, players: 182, badge: "Contender" },
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
      const speedBonus = Math.max(0, timeLeft * 4);
      setScore((prev) => prev + 100 + speedBonus);
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
      // Completed!
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
    const text = `🔥 I just scored ${score} XP in today's 2torConnect Campus Battle Arena (Day ${streak} Streak)! Can you beat me? Test your brain now at https://www.2torconnect.com/arena`;
    if (navigator.share) {
      navigator.share({ title: "2torArena Campus Challenge", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Link Copied!",
        description: "WhatsApp challenge text copied to your clipboard. Paste in your group chat!",
      });
    }
  };

  return (
    <DashboardLayout title="2torArena · Daily Campus Challenge" role={user?.role as any}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600/30 via-primary/30 to-accent/30 border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold mb-3">
                <Flame className="w-3.5 h-3.5 animate-bounce" />
                DAILY SPEED CHALLENGE
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                2torArena: Daily Campus Battle ⚡
              </h1>
              <p className="text-sm text-white/80 max-w-xl mt-1">
                5 rapid-fire questions every day. Build your study streak, earn XP, and lead your university to #1 on the national leaderboard!
              </p>
            </div>

            <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-4 rounded-2xl shrink-0">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-red-400">
                  <Flame className="w-6 h-6 fill-current text-red-500" />
                  {streak}
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Day Streak</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-accent">
                  <Zap className="w-6 h-6 fill-current text-accent" />
                  {score > 0 ? score : "500+"}
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Max XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game State: Intro */}
        {gameState === "intro" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Start Card */}
            <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500 to-accent flex items-center justify-center mb-5 shadow-lg shadow-red-500/20">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">Today's Daily Speed Quiz</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  5 multiple-choice questions covering Calculus, General Studies, Mechanics, and Chemistry. You have <strong>15 seconds</strong> per question. Quick answers earn extra speed bonus XP!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="text-lg font-bold text-white">5 High-Yield</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-muted-foreground">Timer</p>
                    <p className="text-lg font-bold text-accent">15s / Question</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-muted-foreground">Streak Bonus</p>
                    <p className="text-lg font-bold text-red-400">1.5x Multiplier</p>
                  </div>
                </div>

                {streak >= 3 && (
                  <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-2xl flex items-center gap-3 mb-6 text-xs text-accent">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">🔥 {streak}-Day Streak Active!</p>
                      <p className="text-[11px] text-accent/80">Use promo code <code className="bg-black/40 px-1 py-0.5 rounded font-mono">CAMPUS10</code> for 10% off any tutor booking.</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={startQuiz}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 via-primary to-accent text-white font-black text-base hover:opacity-90 transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 fill-current" />
                {alreadyPlayedToday ? "Play Again for Practice" : "Start Today's Battle Arena"}
              </button>
            </div>

            {/* University Leaderboard Widget */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  Campus Cup Standings
                </h3>
                <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">Live</span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {CAMPUS_RANKINGS.slice(0, 5).map((u) => (
                  <div key={u.rank} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        u.rank === 1 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" :
                        u.rank === 2 ? "bg-slate-300/20 text-slate-300 border border-slate-300/40" :
                        u.rank === 3 ? "bg-amber-700/20 text-amber-500 border border-amber-700/40" :
                        "bg-white/5 text-muted-foreground"
                      }`}>
                        {u.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.players} active scholars</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-accent shrink-0">
                      {(u.points).toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-center text-xs text-muted-foreground">
                Represent your school & add points daily!
              </div>
            </div>
          </div>
        )}

        {/* Game State: Playing */}
        {gameState === "playing" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-3xl mx-auto space-y-6">
            {/* Header: Progress & Timer */}
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

              <div className="flex items-center gap-1 text-xs font-bold text-accent">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{score} XP</span>
              </div>
            </div>

            {/* Timer Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-primary to-accent"
                }`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-1 rounded-lg">
                {DAILY_QUESTIONS[currentIdx].course}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-3 leading-relaxed">
                {DAILY_QUESTIONS[currentIdx].question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {DAILY_QUESTIONS[currentIdx].options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === DAILY_QUESTIONS[currentIdx].correct;

                let btnStyle = "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20";
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-green-500/20 border-green-500/50 text-green-300 font-bold shadow-md shadow-green-500/20";
                  } else if (isSelected) {
                    btnStyle = "bg-red-500/20 border-red-500/50 text-red-300";
                  } else {
                    btnStyle = "bg-white/5 border-white/5 text-muted-foreground opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between text-sm ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation reveal */}
            {isAnswered && (
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl animate-in fade-in duration-300">
                <p className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Explanation:
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {DAILY_QUESTIONS[currentIdx].explanation}
                </p>

                <button
                  onClick={nextQuestion}
                  className="mt-4 w-full py-3 rounded-xl bg-accent text-background font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span>{currentIdx + 1 === DAILY_QUESTIONS.length ? "View Final Results" : "Next Question"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Game State: Results */}
        {gameState === "results" && (
          <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 max-w-xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-primary to-accent flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/20">
              <Trophy className="w-10 h-10 text-white animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Challenge Completed! 🎉</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You conquered today's 2torArena speed battle!
              </p>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-black/40 border border-white/10 rounded-2xl">
              <div>
                <p className="text-xs text-muted-foreground">Total XP</p>
                <p className="text-xl sm:text-2xl font-black text-accent">{score}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-xl sm:text-2xl font-black text-green-400">
                  {Math.round((answers.filter(Boolean).length / DAILY_QUESTIONS.length) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-xl sm:text-2xl font-black text-red-400 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-current" />
                  {streak}
                </p>
              </div>
            </div>

            {/* Streak Discount Perk */}
            <div className="p-4 bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/40 rounded-2xl text-left flex items-center gap-3">
              <Award className="w-8 h-8 text-accent shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Daily Streak Reward Unlocked!</p>
                <p className="text-[11px] text-white/80">Use voucher code <strong className="text-accent font-mono">ARENA10</strong> to get 10% off your next 1-on-1 tutor session.</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={shareScore}
                className="flex-1 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>

              <button
                onClick={startQuiz}
                className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Practice Again
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
