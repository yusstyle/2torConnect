import { useState, useRef, useEffect, useCallback } from "react";
import { GraduationCap, ChevronDown, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export const ALL_UNIVERSITIES: string[] = [];

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  token?: string;
}

interface UniResult {
  name: string;
  country: string;
  domain: string | null;
}

export function UniversityCombobox({ value, onChange, placeholder = "Search or type your university…", className = "", required, token }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (query !== value) onChange(query);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, value, onChange]);

  const { data, isLoading } = useQuery({
    queryKey: ["university-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { universities: [] };
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${BASE}/api/universities/search?q=${encodeURIComponent(debouncedQuery)}`, { headers });
      if (!res.ok) return { universities: [] };
      return res.json() as Promise<{ universities: UniResult[] }>;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  const suggestions = data?.universities ?? [];
  const showLoader = isLoading && debouncedQuery.length >= 2;

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-16 text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showLoader && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
          {query && !showLoader && (
            <button type="button" onClick={handleClear} className="p-1 text-muted-foreground hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }} className="p-1 text-muted-foreground hover:text-white transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-white/15 rounded-xl shadow-2xl shadow-black/40 overflow-hidden max-h-64 flex flex-col">
          <div className="overflow-y-auto">
            {debouncedQuery.length < 2 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">Type at least 2 characters to search all universities worldwide</div>
            ) : showLoader ? (
              <div className="px-4 py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching universities worldwide…
              </div>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map(u => (
                  <button
                    key={u.name + u.country}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleSelect(u.name); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-start gap-2 ${
                      u.name === value ? "bg-accent/20 text-accent" : "text-white/80 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.country}</p>
                    </div>
                  </button>
                ))}
              </>
            ) : null}
            {debouncedQuery.trim().length >= 2 && !showLoader && !suggestions.find(u => u.name.toLowerCase() === debouncedQuery.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(debouncedQuery.trim()); }}
                className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-accent/10 transition-colors flex items-center gap-2 border-t border-white/5"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                Use "<span className="font-semibold">{debouncedQuery.trim()}</span>"
              </button>
            )}
          </div>
          <div className="px-4 py-2 border-t border-white/5 bg-white/3">
            <p className="text-[11px] text-muted-foreground">Can't find yours? Just type it above — any university is accepted.</p>
          </div>
        </div>
      )}
    </div>
  );
}
