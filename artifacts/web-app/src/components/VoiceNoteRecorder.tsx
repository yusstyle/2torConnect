import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioDataUrl: string, durationSecs: number) => void;
  onCancel?: () => void;
}

export default function VoiceNoteRecorder({ onSendVoiceNote, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 120) {
            // Auto-stop at 2 minutes
            stopAndSend();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Required",
        description: "Please allow microphone access in your browser settings to record voice notes.",
      });
      if (onCancel) onCancel();
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleCancel = () => {
    cleanup();
    audioChunksRef.current = [];
    if (onCancel) onCancel();
  };

  const stopAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setProcessing(true);
    const recordedDuration = duration;

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        onSendVoiceNote(base64Data, recordedDuration);
        setProcessing(false);
        cleanup();
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.stop();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isRecording) {
    return (
      <button
        type="button"
        onClick={startRecording}
        title="Record Voice Note"
        className="p-2.5 rounded-xl bg-white/5 hover:bg-accent/20 text-muted-foreground hover:text-accent transition-all shrink-0"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-2xl animate-pulse">
      {/* Recording status indicator */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-xs font-mono font-bold text-red-400">
          Recording {formatTimer(duration)}
        </span>
      </div>

      {/* Wave bar indicator */}
      <div className="hidden sm:flex items-center gap-1">
        {[40, 70, 90, 60, 30, 80, 50].map((h, i) => (
          <div
            key={i}
            className="w-1 bg-red-400 rounded-full animate-bounce"
            style={{
              height: `${(h * 0.2)}px`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={processing}
          title="Discard voice note"
          className="p-1.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={stopAndSend}
          disabled={processing}
          title="Send voice note"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-background font-bold text-xs hover:opacity-90 shadow-md transition-all disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
