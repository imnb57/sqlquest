"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMounted } from "@/hooks/use-client";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Segmented three-way theme control. Used in settings. */
export function ThemeSegmented({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // The resolved theme is unknowable on the server, so the control renders
  // unselected until hydration rather than guessing and flipping.
  const mounted = useIsMounted();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn("inline-flex gap-1 rounded-xl bg-bg-inset p-1", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition-all",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-bg-elevated text-fg shadow-sm"
                : "text-fg-muted hover:text-fg",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Single icon button that cycles light → dark. Used in headers. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "grid size-10 place-items-center rounded-xl text-fg-muted transition-colors",
        "hover:bg-bg-inset hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* Both icons render; CSS decides, so there's no hydration mismatch. */}
      <Sun className="size-5 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-5 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
