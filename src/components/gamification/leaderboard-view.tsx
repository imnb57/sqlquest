"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Trophy, Users } from "lucide-react";

import { cn, formatCompact, initials, localDayKey } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/overlays";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAGUES, leagueForWeeklyXp } from "@/lib/gamification/levels";
import { useProgressStore } from "@/stores/progress-store";

interface Entry {
  rank: number;
  username: string | null;
  name: string | null;
  image: string | null;
  country: string | null;
  xp: number;
  lessons: number;
  activeDays: number;
}

const RANGES = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
] as const;

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardView() {
  const { data: session } = useSession();
  const [range, setRange] = React.useState<(typeof RANGES)[number]["id"]>("week");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard", range],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?range=${range}`);
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return (await res.json()) as { available: boolean; entries: Entry[] };
    },
    staleTime: 60_000,
  });

  const weeklyXp = useMyWeeklyXp();
  const league = leagueForWeeklyXp(weeklyXp);
  const leagueIndex = LEAGUES.findIndex((l) => l.id === league.id);
  const nextLeague = LEAGUES[leagueIndex + 1];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold sm:text-3xl">
          <Trophy className="size-7 text-xp-dark dark:text-xp" />
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Ranked by XP earned. Only learners who opted in appear here — you can
          change that any time in{" "}
          <Link href="/settings/privacy" className="font-bold text-brand-500 hover:underline">
            privacy settings
          </Link>
          .
        </p>
      </header>

      <Card
        className="overflow-hidden border-0 bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl" aria-hidden="true">
              {league.glyph}
            </span>
            <div>
              <p className="eyebrow opacity-85">
                Your league
              </p>
              <p className="text-xl font-extrabold">{league.name}</p>
              <p className="text-sm opacity-90">
                {formatCompact(weeklyXp)} XP this week
              </p>
            </div>
          </div>

          {nextLeague && (
            <div className="text-right">
              <p className="eyebrow opacity-85">
                Next league
              </p>
              <p className="text-lg font-extrabold">
                {nextLeague.glyph} {nextLeague.name}
              </p>
              <p className="text-sm opacity-90">
                {Math.max(0, league.promotionXp - weeklyXp)} XP to promote
              </p>
            </div>
          )}
        </div>
      </Card>

      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <TabsList>
          {RANGES.map((r) => (
            <TabsTrigger key={r.id} value={r.id}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError || !data?.available ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto size-8 text-fg-subtle" />
          <h2 className="mt-3 font-extrabold">Leaderboard unavailable</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
            This deployment is running without a database, so there&rsquo;s no
            shared leaderboard. Everything else — lessons, XP, streaks — works
            exactly the same, saved in your browser.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/learn">Keep learning</Link>
          </Button>
        </Card>
      ) : data.entries.length === 0 ? (
        <Card className="p-8 text-center">
          <span className="text-4xl" aria-hidden="true">
            🏁
          </span>
          <h2 className="mt-3 font-extrabold">Nobody on the board yet</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            Finish a lesson and you&rsquo;ll be first.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/learn">Start a lesson</Link>
          </Button>
        </Card>
      ) : (
        <ol className="space-y-2">
          {data.entries.map((entry) => {
            const isMe =
              Boolean(session?.user?.username) &&
              entry.username === session?.user?.username;

            return (
              <li key={`${entry.username}-${entry.rank}`}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    isMe
                      ? "border-brand-500 bg-brand-500/8"
                      : "border-border-base bg-bg-elevated",
                  )}
                >
                  <span className="w-9 shrink-0 text-center text-lg font-extrabold tabular-nums">
                    {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                  </span>

                  <Avatar className="size-10 shrink-0">
                    {entry.image && <AvatarImage src={entry.image} alt="" />}
                    <AvatarFallback>
                      {initials(entry.name ?? entry.username ?? "??")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    {entry.username ? (
                      <Link
                        href={`/profile/${entry.username}`}
                        className="block truncate font-bold hover:text-brand-500"
                      >
                        {entry.name ?? entry.username}
                      </Link>
                    ) : (
                      <span className="block truncate font-bold">
                        {entry.name ?? "Anonymous"}
                      </span>
                    )}
                    <p className="truncate text-xs text-fg-muted">
                      {entry.lessons} lesson{entry.lessons === 1 ? "" : "s"} ·{" "}
                      {entry.activeDays} active day
                      {entry.activeDays === 1 ? "" : "s"}
                    </p>
                  </div>

                  <Badge variant="xp" size="lg" className="shrink-0 tabular-nums">
                    {formatCompact(entry.xp)} XP
                  </Badge>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** XP earned over the last 7 local days, straight from local activity. */
function useMyWeeklyXp(): number {
  const activity = useProgressStore((s) => s.activity);

  return React.useMemo(() => {
    let total = 0;
    const cursor = new Date();
    for (let i = 0; i < 7; i++) {
      total += activity[localDayKey(cursor)]?.xp ?? 0;
      cursor.setDate(cursor.getDate() - 1);
    }
    return total;
  }, [activity]);
}
