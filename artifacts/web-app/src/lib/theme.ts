const STORAGE_KEY = "2tor-theme";

export type Theme = "dark";

export function getStoredTheme(): Theme {
  return "dark";
}

export function applyTheme(_theme?: string) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, "dark");
  }
}

export function applyStoredTheme() {
  applyTheme("dark");
}

export function toggleTheme(): Theme {
  applyTheme("dark");
  return "dark";
}
