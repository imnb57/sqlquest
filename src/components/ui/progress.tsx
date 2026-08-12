"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  value: number;
  max?: number;
  /** Visual weight of the track. */
  size?: "xs" | "sm" | "md" | "lg";
  tone?: "brand" | "success" | "xp" | "streak" | "aqua";
  /** Animated diagonal stripes — used for the in-lesson progress bar. */
  striped?: boolean;
  label?: string;
}

const TONES: Record<NonNullable<ProgressProps["tone"]>, string> = {
  brand: "bg-gradient-to-r from-brand-500 to-brand-400",
  success: "bg-gradient-to-r from-success to-lime-accent-400",
  xp: "bg-gradient-to-r from-xp-dark to-xp",
  streak: "bg-gradient-to-r from-streak to-xp",
  aqua: "bg-gradient-to-r from-aqua-500 to-aqua-300",
};

const SIZES = { xs: "h-1.5", sm: "h-2.5", md: "h-4", lg: "h-5" } as const;

export function Progress({
  value,
  max = 100,
  size = "md",
  tone = "brand",
  striped,
  label,
  className,
  ...props
}: ProgressProps) {
  const pct = clamp((value / (max || 1)) * 100, 0, 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-bg-inset",
        SIZES[size],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          TONES[tone],
        )}
        style={{ width: `${pct}%` }}
      >
        {/* Glossy highlight sells the "chunky game bar" look. */}
        {size !== "xs" && pct > 6 && (
          <span className="absolute top-[18%] left-1.5 h-[26%] rounded-full bg-white/35" style={{ width: `calc(${pct}% - 0.75rem)` }} />
        )}
      </div>
      {striped && (
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,.7)_6px,rgba(255,255,255,.7)_12px)]" />
      )}
    </div>
  );
}

/** Circular variant used for daily-goal rings and lesson node completion. */
export function ProgressRing({
  value,
  max = 100,
  size = 56,
  stroke = 6,
  className,
  tone = "var(--color-brand-500)",
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  className?: string;
  tone?: string;
  children?: React.ReactNode;
}) {
  const pct = clamp((value / (max || 1)) * 100, 0, 100);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-bg-inset"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={tone}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
