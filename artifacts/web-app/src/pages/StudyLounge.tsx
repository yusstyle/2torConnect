import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Clock, Play, Pause, RotateCcw, Volume2, VolumeX,
  Sparkles, CheckSquare, Square, Plus, Trash2,
  Users, CloudRain, BookOpen, Coffee, Waves, Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Mode = "study" | "shortBreak" | "longBreak";

interface StudyTask {
  id: string;
  text: string;
  completed: boolean;
}

// Web Audio API ambient sound generator
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  private alphaOsc: OscillatorNode | null = null;
  private alphaGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Generate soothing synthesized tropical rain
  startRain(volume: number = 0.3) {
    this.initCtx();
    if (!this.ctx) return;
    this.stopRain();

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink / Brown noise filter
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to mimic warm rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
    this.rainNode = whiteNoise;
    this.rainGain = gain;
  }

  stopRain() {
    if (this.rainNode) {
      try { (this.rainNode as any).stop(); } catch {}
      this.rainNode = null;
    }
  }

  setRainVolume(vol: number) {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  // Generate 432Hz Alpha Focus Tone
  startAlpha(volume: number = 0.15) {
    this.initCtx();
    if (!this.ctx) return;
    this.stopAlpha();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(432, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    this.alphaOsc = osc;
    this.alphaGain = gain;
  }

  stopAlpha() {
    if (this.alphaOsc) {
      try { this.alphaOsc.stop(); } catch {}
      this.alphaOsc = null;
    }
  }

  setAlphaVolume(vol: number) {
    if (this.alphaGain && this.ctx) {
      this.alphaGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  // Chime when Pomodoro finishes
  playChime() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5); // A5

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  stopAll() {
    this.stopRain();
    this.stopAlpha();
  }
}

const audioEngine = new AmbientAudioEngine();

export default function StudyLoungePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("study");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Soundscape toggles
  const [rainActive, setRainActive] = useState(false);
  const [rainVol, setRainVol] = useState(0.4);
  const [alphaActive, setAlphaActive] = useState(false);
  const [alphaVol, setAlphaVol] = useState(0.2);

  // Checklist
  const [tasks, setTasks] = useState<StudyTask[]>([
    { id: "1", text: "Complete 10 MTH101 past question derivatives", completed: false },
    { id: "2", text: "Memorize 8 English diphthongs for GST101", completed: false }
  ]);
  const [newTaskInput, setNewTaskInput] = useState("");

  const modeDurations: Record<Mode, number> = {
    study: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    return () => {
      audioEngine.stopAll();
    };
  }, []);

  // Timer loop
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      audioEngine.playChime();
      setIsRunning(false);

      if (mode === "study") {
        setCompletedSessions((c) => c + 1);
        toast({
          title: "Study session finished! 🎓",
          description: "Great work! Time for a well-deserved 5-minute break.",
        });
        setMode("shortBreak");
        setTimeLeft(modeDurations.shortBreak);
      } else {
        toast({
          title: "Break ended! ⚡",
          description: "Ready to jump back into focused study?",
        });
        setMode("study");
        setTimeLeft(modeDurations.study);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(modeDurations[newMode]);
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modeDurations[mode]);
  };

  // Sound toggles
  const toggleRain = () => {
    if (rainActive) {
      audioEngine.stopRain();
      setRainActive(false);
    } else {
      audioEngine.startRain(rainVol);
      setRainActive(true);
    }
  };

  const toggleAlpha = () => {
    if (alphaActive) {
      audioEngine.stopAlpha();
      setAlphaActive(false);
    } else {
      audioEngine.startAlpha(alphaVol);
      setAlphaActive(true);
    }
  };

  // Task list
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [...prev, { id: String(Date.now()), text: newTaskInput.trim(), completed: false }]);
    setNewTaskInput("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalTime = modeDurations[mode];
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <DashboardLayout title="2torLounge · 24/7 Virtual Campus Study Room" role={user?.role as any}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Live Presence Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-primary/20 via-background to-accent/20 border border-white/10 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              🇳🇬 <strong>164 students</strong> studying right now across UNILAG, UI, OAU, FUTA & UNN
            </span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
            <span>Sessions Completed Today:</span>
            <span className="text-accent font-bold px-2 py-0.5 rounded-md bg-white/5">{completedSessions}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Pomodoro Timer */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 flex flex-col items-center justify-between text-center relative overflow-hidden">
            {/* Mode switch pills */}
            <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-2xl mb-6 sm:mb-8 w-full sm:w-auto max-w-md justify-center">
              <button
                onClick={() => switchMode("study")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  mode === "study" ? "bg-accent text-background shadow-md shadow-accent/20" : "text-muted-foreground hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">Deep </span>Study (25m)
              </button>
              <button
                onClick={() => switchMode("shortBreak")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  mode === "shortBreak" ? "bg-accent text-background shadow-md shadow-accent/20" : "text-muted-foreground hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">Short </span>Break (5m)
              </button>
              <button
                onClick={() => switchMode("longBreak")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  mode === "longBreak" ? "bg-accent text-background shadow-md shadow-accent/20" : "text-muted-foreground hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">Long </span>Break (15m)
              </button>
            </div>

            {/* Circular Timer Display */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-white/10"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-accent transition-all duration-1000"
                  strokeWidth="4"
                  strokeDasharray={282.7}
                  strokeDashoffset={282.7 - (282.7 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter">
                  {formatTimer(timeLeft)}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-semibold">
                  {mode === "study" ? "Focus State" : "Rest & Refresh"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={resetTimer}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 transition-all"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={toggleTimer}
                className={`px-8 py-4 rounded-2xl font-black text-base flex items-center gap-2.5 transition-all shadow-xl ${
                  isRunning
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                    : "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-primary/25"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current ml-0.5" /> Start Focus
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Col: Ambient Soundscape & Task Checklist */}
          <div className="space-y-6">

            {/* Ambient Sound Generators */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Waves className="w-4 h-4 text-accent" />
                  Nigerian Focus Soundscape
                </h3>
                <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">Offline Audio</span>
              </div>

              {/* Rain Sound */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CloudRain className={`w-4 h-4 ${rainActive ? "text-accent animate-bounce" : "text-muted-foreground"}`} />
                    <span className="text-xs font-semibold text-white">Rainy Season Rain</span>
                  </div>
                  <button
                    onClick={toggleRain}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      rainActive ? "bg-accent text-background" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {rainActive ? "Playing" : "Play"}
                  </button>
                </div>
                {rainActive && (
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={rainVol}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRainVol(v);
                      audioEngine.setRainVolume(v);
                    }}
                    className="w-full h-1 bg-white/20 rounded accent-accent"
                  />
                )}
              </div>

              {/* 432Hz Alpha Waves */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className={`w-4 h-4 ${alphaActive ? "text-purple-400" : "text-muted-foreground"}`} />
                    <span className="text-xs font-semibold text-white">432Hz Deep Alpha Wave</span>
                  </div>
                  <button
                    onClick={toggleAlpha}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      alphaActive ? "bg-purple-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {alphaActive ? "Playing" : "Play"}
                  </button>
                </div>
                {alphaActive && (
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={alphaVol}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAlphaVol(v);
                      audioEngine.setAlphaVolume(v);
                    }}
                    className="w-full h-1 bg-white/20 rounded accent-purple-400"
                  />
                )}
              </div>
            </div>

            {/* Session Goals Checklist */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-400" />
                  Study Session Goals
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {tasks.filter((t) => t.completed).length} / {tasks.length} Done
                </span>
              </div>

              <form onSubmit={addTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add target for this session…"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!newTaskInput.trim()}
                  className="p-2 rounded-xl bg-accent text-background disabled:opacity-40 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-4 h-4 text-green-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={`truncate ${task.completed ? "line-through text-muted-foreground" : "text-white"}`}>
                        {task.text}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-muted-foreground hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

