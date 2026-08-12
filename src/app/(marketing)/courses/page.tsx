import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock, Layers, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema, courseSchema } from "@/lib/seo";
import { curriculumStats, tracks } from "@/content/curriculum";
import { formatDuration } from "@/lib/utils";
import { lessonXp } from "@/content/types";

export const metadata: Metadata = buildMetadata({
  title: "SQL courses — beginner to expert",
  description: `All six SQLQuest tracks: ${curriculumStats.lessons} interactive lessons and ${curriculumStats.challenges} challenges covering SELECT, joins, aggregation, window functions, CTEs, data modelling and query tuning. Free and open source.`,
  path: "/courses",
  keywords: [
    "SQL course",
    "free SQL course",
    "learn SQL online",
    "SQL curriculum",
    "SQL for beginners",
    "advanced SQL course",
  ],
});

export default function CoursesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Courses", path: "/courses" },
          ]),
          ...tracks.map((track) =>
            courseSchema({
              name: track.title,
              description: track.description,
              path: `/courses/${track.slug}`,
              level: track.level,
              hours:
                track.units.reduce(
                  (sum, u) => sum + u.lessons.reduce((s, l) => s + l.estimatedMinutes, 0),
                  0,
                ) / 60,
              lessons: track.units.reduce((sum, u) => sum + u.lessons.length, 0),
            }),
          ),
        ]}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="lg">
            <Layers />
            {curriculumStats.tracks} tracks · {curriculumStats.lessons} lessons
          </Badge>
          <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
            The complete SQL curriculum
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Everything from your first <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[0.9em]">SELECT</code>{" "}
            to reading execution plans, in the order that makes each piece
            follow from the last. Every lesson runs on real PostgreSQL in your
            browser.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/learn">
                Start from the beginning
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/playground">Open the playground</Link>
            </Button>
          </div>
        </header>

        <div className="mt-14 space-y-6">
          {tracks.map((track, index) => {
            const lessons = track.units.flatMap((u) => u.lessons);
            const minutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
            const xp = lessons.reduce((n, l) => n + lessonXp(l), 0);
            const challenges = lessons.reduce((n, l) => n + l.challenges.length, 0);

            return (
              <Card key={track.id} interactive className="overflow-hidden">
                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:p-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl ${track.accent}`}
                        aria-hidden="true"
                      >
                        {track.glyph}
                      </span>
                      <div>
                        <p className="eyebrow text-fg-subtle">
                          Track {index + 1} · {track.level}
                        </p>
                        <h2 className="text-2xl font-extrabold">
                          <Link
                            href={`/courses/${track.slug}`}
                            className="hover:text-brand-500"
                          >
                            {track.title}
                          </Link>
                        </h2>
                      </div>
                    </div>

                    <p className="mt-4 leading-relaxed text-fg-muted">
                      {track.description}
                    </p>

                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {track.outcomes.map((outcome) => (
                        <li key={outcome} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          <span className="text-fg-muted">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lg:border-l lg:border-border-base lg:pl-6">
                    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                      {[
                        [<Layers key="l" className="size-4" />, "Lessons", lessons.length],
                        [<Zap key="z" className="size-4" />, "XP available", xp],
                        [<Check key="c" className="size-4" />, "Challenges", challenges],
                        [<Clock key="t" className="size-4" />, "Time", formatDuration(minutes)],
                      ].map(([icon, label, value]) => (
                        <div key={label as string}>
                          <dt className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-fg-subtle uppercase">
                            {icon}
                            {label}
                          </dt>
                          <dd className="mt-0.5 text-xl font-extrabold tabular-nums">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <Button className="mt-6" full asChild>
                      <Link href={`/courses/${track.slug}`}>
                        View syllabus
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border-base bg-bg-subtle px-6 py-4 lg:px-8">
                  <p className="eyebrow text-fg-subtle">
                    Units
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {track.units.map((unit) => (
                      <li key={unit.id}>
                        <Badge variant="neutral">{unit.title}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
