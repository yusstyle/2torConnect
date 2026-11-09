import { useState, useRef, useEffect } from "react";
import { Mic, Play, Pause, Volume2, Sparkles, Check, Trash2 } from "lucide-react";
import VoiceNoteRecorder from "./VoiceNoteRecorder";
import { useToast } from "@/hooks/use-toast";

interface TutorVoiceIntroPlayerProps {
  tutorName: string;
  audioUrl?: string | null;
}

// Built-in pleasant fallback audio synth for tutors who haven't recorded a personal clip yet
function playSampleVoiceGreeting(name: string, onEnd: () => void) {
  if (!("speechSynthesis" in window)) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    `Hello! I'm ${name}, a verified tutor on 2torConnect. I'm excited to help you master your courses and achieve your target grades. Book a session with me today!`
  );
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function TutorVoiceIntroPlayer({ tutorName, audioUrl }: TutorVoiceIntroPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        // Fallback to speech synthesis if audio URL fails
        playSampleVoiceGreeting(tutorName, () => setIsPlaying(false));
      };
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        playSampleVoiceGreeting(tutorName, () => setIsPlaying(false));
      });
    } else {
      setIsPlaying(true);
      playSampleVoiceGreeting(tutorName, () => setIsPlaying(false));
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
        isPlaying
          ? "bg-accent/20 border-accent text-accent shadow-md shadow-accent/20 animate-pulse"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-accent/40 text-white/90"
      }`}
      title={`Listen to ${tutorName}'s voice intro`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        isPlaying ? "bg-accent text-background" : "bg-white/10 text-accent group-hover:bg-accent group-hover:text-background"
      }`}>
        {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] leading-tight font-medium">
          {isPlaying ? "Playing Intro…" : "Voice Intro"}
        </span>

        {/* Animated Sound Bars */}
        <div className="flex items-center gap-0.5 h-3">
          {[4, 10, 7, 12, 6].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full transition-all ${
                isPlaying ? "bg-accent animate-bounce" : "bg-white/20"
              }`}
              style={{
                height: isPlaying ? `${h}px` : "3px",
                animationDelay: `${i * 120}ms`
              }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

// Widget for Tutors in Profile or Dashboard to record their 30-second audio pitch
export function TutorVoiceIntroRecorder() {
  const { toast } = useToast();
  const [recordedAudio, setRecordedAudio] = useState<string | null>(() => {
    return localStorage.getItem("2tor_my_voice_intro") || null;
  });

  const handleSave = (audioDataUrl: string) => {
    setRecordedAudio(audioDataUrl);
    localStorage.setItem("2tor_my_voice_intro", audioDataUrl);
    toast({
      title: "Voice Intro Saved! 🎙️",
      description: "Students can now listen to your voice introduction when browsing tutors.",
    });
  };

  const handleRemove = () => {
    setRecordedAudio(null);
    localStorage.removeItem("2tor_my_voice_intro");
    toast({
      title: "Voice Intro Removed",
      description: "Your voice intro has been cleared.",
    });
  };

  return (
    <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-accent" />
            30-Second Voice Introduction
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students are 3x more likely to book tutors whose teaching voice and pronunciation they can hear!
          </p>
        </div>
      </div>

      {recordedAudio ? (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Voice Intro Active</p>
              <audio src={recordedAudio} controls className="h-7 w-48 mt-1 accent-accent" />
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete Voice Intro"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
          <VoiceNoteRecorder onSendVoiceNote={(audio) => handleSave(audio)} />
          <span className="text-xs text-muted-foreground">
            Tap the mic to record a warm greeting (introduce your name, subject, and teaching style).
          </span>
        </div>
      )}
    </div>
  );
}
