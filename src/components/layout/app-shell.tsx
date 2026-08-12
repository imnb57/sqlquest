"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  Map,
  Medal,
  Settings,
  ShoppingBag,
  Sparkles,
  TerminalSquare,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { StatHud, LevelBar } from "@/components/gamification/stat-hud";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { DailyGoalCard } from "@/components/gamification/daily-goal-card";

/**
 * Authenticated app chrome.
 *
 * Three-column on desktop (nav · content · context rail), single column with
 * a bottom tab bar on mobile — the layout learners actually expect from a
 * habit app.
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Shown in the mobile tab bar. */
  primary?: boolean;
}

const NAV: NavItem[] = [
  { href: "/learn", label: "Learn", icon: Map, primary: true },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/practice", label: "Practice", icon: Dumbbell, primary: true },
  { href: "/playground", label: "Playground", icon: TerminalSquare, primary: true },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Medal, primary: true },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
];

const PRIMARY_NAV = NAV.filter((n) => n.primary);

function useIsActive() {
  const pathname = usePathname();
  return React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );
}

export function AppShell({
  children,
  rail,
}: {
  children: React.ReactNode;
  /** Optional right-hand context column (quests, streak, tips). */
  rail?: React.ReactNode;
}) {
  const isActive = useIsActive();

  return (
    <div className="min-h-dvh">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border-base bg-bg/85 px-4 py-2.5 backdrop-blur-lg lg:hidden">
        <Logo showWordmark={false} />
        <StatHud />
        <UserMenu compact />
      </header>

      <div className="mx-auto flex w-full max-w-[110rem] gap-6 px-0 lg:px-6">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 py-6 lg:flex xl:w-72">
          <Logo className="px-2" />

          <LevelBar className="px-2" />

          <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 section-label transition-all",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-brand-500/12 text-brand-600 dark:text-brand-300"
                      : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-transform group-hover:scale-110",
                      active && "text-brand-500",
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center justify-between gap-2 px-1">
            <UserMenu />
            <ThemeToggle />
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1 pb-24 lg:pb-10">
          <header className="sticky top-0 z-30 hidden items-center justify-end gap-3 bg-bg/80 py-4 backdrop-blur-lg lg:flex">
            <StatHud />
          </header>
          <main id="main" className="min-w-0">
            {children}
          </main>
        </div>

        {/* Context rail */}
        {rail && (
          <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col gap-4 overflow-y-auto scroll-thin py-6 xl:flex">
            {rail}
          </aside>
        )}
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-base bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <ul className="flex items-stretch">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 eyebrow transition-colors",
                    active ? "text-brand-500" : "text-fg-subtle",
                  )}
                >
                  <Icon className={cn("size-5.5", active && "scale-110")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Default rail used by most app pages. */
export function DefaultRail() {
  return (
    <>
      <DailyGoalCard />
      <StreakPromo />
    </>
  );
}

function StreakPromo() {
  return (
    <div className="card-surface p-5">
      <h3 className="flex items-center gap-2 section-label">
        <Sparkles className="size-4 text-brand-500" />
        Why streaks work
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        Ten focused minutes a day beats a three-hour session once a fortnight.
        Spaced repetition is what moves SQL from &ldquo;I could look that
        up&rdquo; to &ldquo;I just know it&rdquo;.
      </p>
      <Link
        href="/blog/how-to-actually-learn-sql"
        className="mt-3 inline-block text-sm font-bold text-brand-500 hover:underline"
      >
        Read the method →
      </Link>
    </div>
  );
}
