import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getStoredTheme, toggleTheme, type Theme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  return (
    <button
      onClick={() => setThemeState(toggleTheme())}
      aria-label="Toggle light/dark mode"
      className={`p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-colors ${className}`}
    >
      {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}