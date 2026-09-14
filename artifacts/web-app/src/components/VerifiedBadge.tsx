import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <BadgeCheck
      className="text-blue-400 fill-blue-400/20 shrink-0"
      size={size}
      aria-label="Verified"
    />
  );
}