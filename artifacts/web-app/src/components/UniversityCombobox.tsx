import { useState, useRef, useEffect } from "react";
import { GraduationCap, ChevronDown, X } from "lucide-react";

export const ALL_UNIVERSITIES = [
  // Nigeria
  "Ahmadu Bello University", "Babcock University", "Bayero University Kano",
  "Covenant University", "Federal University Dutse", "Federal University of Technology Akure",
  "Lagos State University", "Ladoke Akintola University of Technology",
  "Nnamdi Azikiwe University", "Obafemi Awolowo University", "Pan-Atlantic University",
  "University of Abuja", "University of Benin", "University of Ibadan",
  "University of Lagos", "University of Nigeria Nsukka", "University of Port Harcourt",
  // USA
  "Columbia University", "Harvard University", "Johns Hopkins University",
  "Massachusetts Institute of Technology (MIT)", "New York University",
  "Princeton University", "Stanford University", "UC Berkeley",
  "University of Chicago", "University of Michigan", "University of Texas at Austin",
  "University of Washington", "Yale University",
  // UK
  "Imperial College London", "King's College London", "London School of Economics",
  "University College London (UCL)", "University of Cambridge", "University of Edinburgh",
  "University of Manchester", "University of Oxford",
  // Canada
  "McGill University", "University of British Columbia", "University of Toronto",
  "University of Waterloo",
  // Australia
  "Australian National University", "University of Melbourne", "University of Sydney",
  // Europe
  "Delft University of Technology", "ETH Zurich", "Sorbonne University",
  "Technical University of Munich",
  // Africa
  "Addis Ababa University", "Kwame Nkrumah University of Science and Technology",
  "Makerere University", "University of Cape Town", "University of Dar es Salaam",
  "University of Ghana", "University of Nairobi", "University of the Witwatersrand",
  // Asia
  "IIT Bombay", "IIT Delhi", "National University of Singapore",
  "Peking University", "Tsinghua University", "University of Delhi", "University of Tokyo",
  // Middle East
  "American University of Beirut", "King Abdulaziz University",
].sort();

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function UniversityCombobox({ value, onChange, placeholder = "Search or type your university…", className = "", required }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

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

  const suggestions = query.trim().length === 0
    ? ALL_UNIVERSITIES.slice(0, 8)
    : ALL_UNIVERSITIES.filter(u => u.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 10);

  const handleSelect = (u: string) => {
    setQuery(u);
    onChange(u);
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
          {query && (
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
            {suggestions.length > 0 ? (
              <>
                {suggestions.map(u => (
                  <button
                    key={u}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleSelect(u); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      u === value ? "bg-accent/20 text-accent" : "text-white/80 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {u}
                  </button>
                ))}
              </>
            ) : null}
            {query.trim() && !suggestions.find(u => u.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(query.trim()); }}
                className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-accent/10 transition-colors flex items-center gap-2 border-t border-white/5"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                Use "<span className="font-semibold">{query.trim()}</span>"
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
