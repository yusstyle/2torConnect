interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 40, className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ lineHeight: 1 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="fig-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="fig-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <clipPath id="circle-clip">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
        </defs>

        {/* Outer gradient ring */}
        <circle cx="50" cy="50" r="48" stroke="url(#ring-grad)" strokeWidth="4" fill="none" />

        {/* Dark fill background */}
        <circle cx="50" cy="50" r="44" fill="#0f0f1a" />

        {/* Left figure (cyan) — head */}
        <circle cx="33" cy="30" r="9" fill="url(#fig-left)" />
        {/* Left figure — body/shoulders */}
        <path d="M18 62 Q18 48 33 48 Q44 48 44 56 L44 66 Q36 62 18 62Z" fill="url(#fig-left)" />

        {/* Right figure (purple) — head */}
        <circle cx="67" cy="30" r="9" fill="url(#fig-right)" />
        {/* Right figure — body/shoulders */}
        <path d="M82 62 Q82 48 67 48 Q56 48 56 56 L56 66 Q64 62 82 62Z" fill="url(#fig-right)" />

        {/* Chain link icon in the middle-bottom area */}
        {/* Left link oval */}
        <ellipse cx="41" cy="68" rx="9" ry="6" fill="none" stroke="url(#link-grad)" strokeWidth="3.5" strokeLinecap="round" transform="rotate(-30 41 68)" />
        {/* Right link oval — interlocked */}
        <ellipse cx="59" cy="72" rx="9" ry="6" fill="none" stroke="url(#link-grad)" strokeWidth="3.5" strokeLinecap="round" transform="rotate(-30 59 72)" />
      </svg>

      {showText && (
        <span
          className="font-display font-bold text-white tracking-tight"
          style={{ fontSize: size * 0.52, lineHeight: 1.1 }}
        >
          2tor<span style={{ color: "#00d4ff" }}>Connect</span>
        </span>
      )}
    </div>
  );
}
