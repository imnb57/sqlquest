import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Flame, Target, Trophy, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/overlays";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { db, schema } from "@/db";
import { getLevelProgress } from "@/lib/gamification/levels";
import { curriculumStats } from "@/content/curriculum";
import { formatCompact, initials } from "@/lib/utils";

/**
 * Public profile.
 *
 * Rendered on demand, honours the learner's `publicProfile` setting, and
 * degrades to a 404 when there's no database — a deployment without one has
 * no accounts, so there is genuinely nothing at this URL.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

async function loadProfile(username: string) {
  if (!db) return null;

  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      image: schema.users.image,
      bio: schema.users.bio,
      country: schema.users.country,
      createdAt: schema.users.createdAt,
      xp: schema.userStats.xp,
      streak: schema.userStats.streak,
      longestStreak: schema.userStats.longestStreak,
      lessonsCompleted: schema.userStats.totalLessonsCompleted,
      challengesSolved: schema.userStats.totalChallengesSolved,
      isPublic: schema.userSettings.publicProfile,
    })
    .from(schema.users)
    .leftJoin(schema.userStats, eq(schema.userStats.userId, schema.users.id))
    .leftJoin(schema.userSettings, eq(schema.userSettings.userId, schema.users.id))
    .where(eq(schema.users.username, username.toLowerCase()))
    .limit(1);

  const row = rows[0];
  // A missing settings row means defaults, and the default is public.
  if (!row || row.isPublic === false) return null;
  return row;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) return { title: "Profile not found", robots: { index: false } };

  const level = getLevelProgress(profile.xp ?? 0);

  return buildMetadata({
    title: `${profile.name ?? profile.username} on SQLQuest`,
    description: `Level ${level.level} ${level.rank.title} · ${formatCompact(profile.xp ?? 0)} XP · ${profile.lessonsCompleted ?? 0} lessons completed.`,
    path: `/profile/${profile.username}`,
  });
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) notFound();

  const level = getLevelProgress(profile.xp ?? 0);
  const joined = new Date(profile.createdAt).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  const stats = [
    {
      icon: <Zap className="size-5 text-xp-dark dark:text-xp" />,
      label: "Total XP",
      value: formatCompact(profile.xp ?? 0),
      tone: "bg-xp/15",
    },
    {
      icon: <Flame className="size-5 text-streak" />,
      label: "Day streak",
      value: profile.streak ?? 0,
      tone: "bg-streak/15",
    },
    {
      icon: <Trophy className="size-5 text-brand-500" />,
      label: "Longest streak",
      value: profile.longestStreak ?? 0,
      tone: "bg-brand-500/15",
    },
    {
      icon: <Target className="size-5 text-success" />,
      label: "Challenges",
      value: profile.challengesSolved ?? 0,
      tone: "bg-success/15",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: profile.name ?? profile.username ?? "Profile", path: `/profile/${profile.username}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: profile.name ?? profile.username,
              alternateName: profile.username,
              description: profile.bio ?? undefined,
            },
          },
        ]}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <header className="flex flex-wrap items-start gap-6">
          <Avatar className="size-24 shrink-0">
            {profile.image && <AvatarImage src={profile.image} alt="" />}
            <AvatarFallback className="text-2xl">
              {initials(profile.name ?? profile.username)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold">
              {profile.name ?? profile.username}
            </h1>
            <p className="font-mono text-sm text-fg-subtle">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-3 leading-relaxed text-fg-muted">{profile.bio}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge
                size="lg"
                className={`bg-gradient-to-r text-white ${level.rank.gradient}`}
              >
                {level.rank.glyph} {level.rank.title}
              </Badge>
              <Badge variant="neutral">Level {level.level}</Badge>
              <Badge variant="outline">Joined {joined}</Badge>
            </div>
          </div>
        </header>

        <div className="mt-8">
          <div className="mb-1.5 flex items-center justify-between eyebrow text-fg-subtle">
            <span>Progress to level {level.level + 1}</span>
            <span className="tabular-nums">
              {level.isMaxLevel
                ? "MAX"
                : `${Math.round(level.xpIntoLevel)} / ${level.xpForNextLevel}`}
            </span>
          </div>
          <Progress value={level.percent} tone="xp" label="Level progress" />
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Card className="p-4 text-center">
                <div
                  className={`mx-auto grid size-10 place-items-center rounded-xl ${stat.tone}`}
                >
                  {stat.icon}
                </div>
                <p className="mt-2 text-2xl font-extrabold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs font-bold tracking-wide text-fg-subtle uppercase">
                  {stat.label}
                </p>
              </Card>
            </li>
          ))}
        </ul>

        <Card className="mt-6 p-5">
          <h2 className="section-label">
            Course progress
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <Progress
              value={profile.lessonsCompleted ?? 0}
              max={curriculumStats.lessons}
              tone="success"
              className="flex-1"
              label="Lessons completed"
            />
            <span className="shrink-0 text-sm font-extrabold tabular-nums">
              {profile.lessonsCompleted ?? 0}/{curriculumStats.lessons}
            </span>
          </div>
        </Card>

        <div className="mt-10 rounded-2xl border border-border-base bg-bg-subtle p-6 text-center">
          <h2 className="font-extrabold">Learning SQL too?</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            {curriculumStats.lessons} lessons, {curriculumStats.challenges}{" "}
            challenges, free forever.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/learn">Start learning</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
