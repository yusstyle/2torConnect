interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 40, className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}images/logo.png`}
        alt="2torConnect logo"
        width={size}
        height={size}
        className="rounded-xl object-contain"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className="font-display font-bold text-2xl text-white tracking-tight">
          2tor<span className="text-accent">Connect</span>
        </span>
      )}
    </div>
  );
}
