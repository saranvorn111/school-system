import { useId } from "react";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Cambodia: blue, red, blue bands with a simplified white Angkor Wat. */
function CambodiaFlag() {
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
      <rect width="30" height="20" fill="#032ea1" />
      <rect y="5" width="30" height="10" fill="#e00025" />
      <g fill="#fff">
        {/* three towers */}
        <path d="M15 6 l1.2 2.4 v2.8 h-2.4 v-2.8 Z" />
        <path d="M11.6 7.4 l0.95 1.9 v1.9 h-1.9 v-1.9 Z" />
        <path d="M18.4 7.4 l0.95 1.9 v1.9 h-1.9 v-1.9 Z" />
        {/* terraces */}
        <rect x="10.2" y="11.1" width="9.6" height="1.1" />
        <rect x="9.3" y="12.2" width="11.4" height="1.2" />
      </g>
    </svg>
  );
}

/** United Kingdom, used for English. */
function UnitedKingdomFlag() {
  // Each flag instance needs its own clip-path id, or two on one page would clash.
  const clip = useId();
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
      <clipPath id={clip}>
        <path d="M30 15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" clipPath={`url(#${clip})`} stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0 v30 M0 15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 v30 M0 15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

const FLAGS: Record<Locale, () => React.ReactNode> = { en: UnitedKingdomFlag, km: CambodiaFlag };

/** Round flag for a language. Decorative: the language name next to it carries the meaning. */
export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  const Flag = FLAGS[locale];
  return (
    <span className={cn("inline-block size-5 shrink-0 overflow-hidden rounded-full ring-1 ring-border", className)}>
      <Flag />
    </span>
  );
}
