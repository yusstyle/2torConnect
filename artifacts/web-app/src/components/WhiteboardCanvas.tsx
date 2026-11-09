import { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen, Eraser, Square, Circle, Minus, ArrowRight,
  RotateCcw, Trash2, Download, Palette, Grid, Type, Check
} from "lucide-react";

interface WhiteboardCanvasProps {
  height?: string | number;
  initialBackground?: "dots" | "grid" | "plain";
}

type Tool = "pen" | "highlighter" | "eraser" | "line" | "arrow" | "rect" | "circle" | "text";

const COLORS = [
  "#FFFFFF", // White
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];

export default function WhiteboardCanvas({ height = "100%", initialBackground = "grid" }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>("#06B6D4");
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [bgStyle, setBgStyle] = useState<"dots" | "grid" | "plain">(initialBackground);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Save existing canvas image
    const ctx = canvas.getContext("2d");
    let tempImage: ImageData | null = null;
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      try {
        tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {}
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (tempImage) {
        ctx.putImageData(tempImage, 0, 0);
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imgData]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = [...history];
    const prevSnapshot = newHistory.pop();
    setHistory(newHistory);

    if (prevSnapshot) {
      ctx.putImageData(prevSnapshot, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveHistory();
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setStartPos(coords);

    // Save snapshot for shapes preview
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);

    if (tool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = `${color}40`;
      ctx.lineWidth = lineWidth * 3.5;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = lineWidth * 5;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (snapshot && startPos) {
      // Restore before drawing preview
      ctx.putImageData(snapshot, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      const dpr = window.devicePixelRatio || 1;
      const startX = startPos.x * dpr;
      const startY = startPos.y * dpr;
      const curX = coords.x * dpr;
      const curY = coords.y * dpr;

      ctx.beginPath();
      if (tool === "line") {
        ctx.moveTo(startX, startY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      } else if (tool === "arrow") {
        ctx.moveTo(startX, startY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(curY - startY, curX - startX);
        const headLen = 14 * dpr;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX - headLen * Math.cos(angle - Math.PI / 6), curY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX - headLen * Math.cos(angle + Math.PI / 6), curY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.strokeRect(startX, startY, curX - startX, curY - startY);
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(curX - startX, 2) + Math.pow(curY - startY, 2));
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const endDraw = () => {
    setIsDrawing(false);
    setStartPos(null);
    setSnapshot(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create export canvas with background filled
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext("2d");
    if (!expCtx) return;

    // Fill background
    expCtx.fillStyle = "#0c0d1a";
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw main canvas
    expCtx.drawImage(canvas, 0, 0);

    // Add watermark
    expCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
    expCtx.font = "bold 20px Inter, sans-serif";
    expCtx.fillText("2torConnect · 2torBoard Notes", 24, exportCanvas.height - 24);

    const link = document.createElement("a");
    link.download = `2torBoard-notes-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0B16] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative select-none">
      {/* Top Toolbar */}
      <div className="shrink-0 p-2.5 sm:p-3 bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-2 flex-wrap z-10">
        {/* Left: Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === "pen" ? "bg-accent text-background font-bold shadow-md shadow-accent/20" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Pen"
          >
            <Pen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          <button
            onClick={() => setTool("highlighter")}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === "highlighter" ? "bg-accent text-background font-bold" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Highlighter"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === "eraser" ? "bg-accent text-background font-bold" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <div className="h-5 w-px bg-white/10 mx-0.5" />

          {/* Shapes */}
          <button
            onClick={() => setTool("line")}
            className={`p-2 rounded-xl text-xs transition-all ${
              tool === "line" ? "bg-accent text-background font-bold" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Straight Line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool("arrow")}
            className={`p-2 rounded-xl text-xs transition-all ${
              tool === "arrow" ? "bg-accent text-background font-bold" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Arrow"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool("rect")}
            className={`p-2 rounded-xl text-xs transition-all ${
              tool === "rect" ? "bg-accent text-background font-bold" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTool("circle")}
            className={`p-2 rounded-xl text-xs transition-all ${
              tool === "circle" ? "bg-accent text-background font-bold" : "bg-white/5 hover:bg-white/10 text-white"
            }`}
            title="Circle"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle: Colors & Stroke */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Color palette */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  color === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-black" : "hover:scale-110 opacity-70 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs text-white">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-colors ${
                  lineWidth === w ? "bg-white/20 text-accent font-bold" : "text-muted-foreground hover:text-white"
                }`}
              >
                {w === 2 ? "Fine" : w === 4 ? "Med" : "Bold"}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions (Undo, Background, Clear, Download) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            title="Undo"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setBgStyle(bgStyle === "grid" ? "dots" : bgStyle === "dots" ? "plain" : "grid")}
            title={`Toggle Grid: ${bgStyle}`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs transition-all flex items-center gap-1"
          >
            <Grid className="w-3.5 h-3.5 text-accent" />
          </button>

          <button
            onClick={clearCanvas}
            title="Clear Canvas"
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              downloadSuccess ? "bg-green-500 text-white" : "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-md shadow-primary/20"
            }`}
            title="Export handwritten notes as image"
          >
            {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{downloadSuccess ? "Saved!" : "Export"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Area with Pattern Background */}
      <div
        ref={containerRef}
        className={`flex-1 relative cursor-crosshair overflow-hidden touch-none ${
          bgStyle === "grid"
            ? "bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px]"
            : bgStyle === "dots"
            ? "bg-[radial-gradient(#ffffff15_1px,transparent_1px)] bg-[size:24px_24px]"
            : "bg-[#0B0B16]"
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="absolute inset-0"
        />

        {/* Small Canvas Hint Watermark */}
        <div className="absolute bottom-3 left-4 pointer-events-none opacity-30 text-[11px] font-mono text-white flex items-center gap-2">
          <span>2torBoard Live</span>
          <span>·</span>
          <span>Draw formulas & diagrams</span>
        </div>
      </div>
    </div>
  );
}
