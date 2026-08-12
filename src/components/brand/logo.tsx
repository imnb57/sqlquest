import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

/**
 * The mark: a stack of database discs that reads as both a cylinder and a
 * levelling-up bar. Pure inline SVG — no image request, scales perfectly, and
 * inherits currentColor for the wordmark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={`${siteConfig.name} logo`}
      className={cn("size-9", className)}
    >
      <defs>
        <linearGradient id="sqlquest-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#sqlquest-mark)" />
      <ellipse cx="20" cy="13" rx="11" ry="4.2" fill="white" fillOpacity="0.95" />
      <path
        d="M9 13v7c0 2.32 4.92 4.2 11 4.2s11-1.88 11-4.2v-7"
        fill="white"
        fillOpacity="0.55"
      />
      <path
        d="M9 20v7c0 2.32 4.92 4.2 11 4.2s11-1.88 11-4.2v-7"
        fill="white"
        fillOpacity="0.3"
      />
      <circle cx="29.5" cy="28.5" r="5.5" fill="#a3e635" stroke="white" strokeWidth="2" />
      <path
        d="m27 28.6 1.8 1.9 3.4-3.7"
        fill="none"
        stroke="#1f1a2e"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark className="size-9 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      {showWordmark && (
        <span className="text-xl font-extrabold tracking-tight">
          SQL<span className="text-gradient">Quest</span>
        </span>
      )}
    </Link>
  );
}
