import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Swords, Target, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema, courseSchema } from "@/lib/seo";
import { tracks, getTrack } from "@/content/curriculum";
import { lessonXp } from "@/content/types";
import { formatDuration } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return tracks.map((track) => ({ slug: track.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) return { title: "Course not found" };

  const lessons = track.units.flatMap((u) => u.lessons);

  return buildMetadata({
    title: `${track.title} — free interactive SQL course`,
    description: `${track.description} ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.challenges.length, 0)} hands-on challenges, running on real Postgres in your browser.`,
    path: `/courses/${track.slug}`,
    keywords: [
      ...lessons.flatMap((l) => l.keywords).slice(0, 12),
      `${track.title} tutorial`,
    ],
  });
}

export default async function TrackPage({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();

  const lessons = track.units.flatMap((u) => u.lessons);
  const minutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
  const totalXp = lessons.reduce((n, l) => n + lessonXp(l), 0);
  const challenges = lessons.reduce((n, l) => n + l.challenges.length, 0);
  const firstLesson = lessons[0];

  const index = tracks.findIndex((t) => t.id === track.id);
  const previous = tracks[index - 1];
  const next = tracks[index + 1];

  return (
    <>
      <JsonLd
        data={[
          courseSchema({
            name: track.title,
            description: track.description,
            path: `/courses/${track.slug}`,
            level: track.level,
            hours: minutes / 60,
            lessons: lessons.length,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Courses", path: "/courses" },
            { name: track.title, path: `/courses/${track.slug}` },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-fg-subtle">
            <li>
              <Link href="/courses" className="font-semibold hover:text-brand-500">
                Courses
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-bold text-fg">{track.title}</li>
          </ol>
        </nav>

        <header
          className={`overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white lg:p-10 ${track.accent}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl" aria-hidden="true">
              {track.glyph}
            </span>
            <Badge className="border-white/30 bg-white/20 text-white">
              {track.level}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            {track.title}
          </h1>
          <p className="mt-2 text-lg opacity-95">{track.subtitle}</p>
          <p className="mt-4 max-w-3xl leading-relaxed opacity-90">
            {track.description}
          </p>

          <dl className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              [<Target key="a" />, "Lessons", lessons.length],
              [<Check key="b" />, "Challenges", challenges],
              [<Zap key="c" />, "XP", totalXp],
              [<Clock key="d" />, "Time", formatDuration(minutes)],
            ].map(([icon, label, value]) => (
              <div key={label as string}>
                <dt className="flex items-center gap-1.5 eyebrow opacity-85">
                  <span className="[&>svg]:size-3.5">{icon}</span>
                  {label}
                </dt>
                <dd className="text-2xl font-extrabold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <Button size="lg" variant="accent" className="mt-7" asChild>
            <Link href={`/learn/${firstLesson.slug}`}>
              Start this track
              <ArrowRight />
            </Link>
          </Button>
        </header>

        <section className="mt-10">
          <h2 className="text-2xl font-extrabold">What you&rsquo;ll be able to do</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {track.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex gap-3 rounded-xl border border-border-base bg-bg-elevated p-4"
              >
                <Check className="mt-0.5 size-5 shrink-0 text-success" />
                <span className="text-sm leading-relaxed">{outcome}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Syllabus</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {track.units.length} units · {lessons.length} lessons. Each lesson
            opens with a short explanation, then puts you straight into the
            editor.
          </p>

          <div className="mt-6 space-y-8">
            {track.units.map((unit, unitIndex) => (
              <div key={unit.id} id={unit.slug}>
                <div className="flex items-baseline gap-3">
                  <span className="eyebrow text-fg-subtle">
                    Unit {unitIndex + 1}
                  </span>
                  <h3 className="text-lg font-extrabold">{unit.title}</h3>
                </div>
                <p className="mt-1 text-sm text-fg-muted">{unit.description}</p>

                <ol className="mt-4 space-y-2">
                  {unit.lessons.map((lesson, lessonIndex) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/${lesson.slug}`}
                        className="group flex items-center gap-4 rounded-xl border border-border-base bg-bg-elevated p-4 transition-all hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
                      >
                        <span
                          className={
                            "grid size-9 shrink-0 place-items-center rounded-lg text-sm font-extrabold tabular-nums " +
                            (lesson.kind === "boss"
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                              : "bg-bg-inset text-fg-muted")
                          }
                        >
                          {lesson.kind === "boss" ? (
                            <Swords className="size-4.5" />
                          ) : (
                            lessonIndex + 1
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold group-hover:text-brand-500">
                            {lesson.title}
                          </h4>
                          <p className="truncate text-sm text-fg-muted">
                            {lesson.subtitle}
                          </p>
                        </div>

                        <div className="hidden shrink-0 items-center gap-2 sm:flex">
                          <Badge variant="neutral" size="sm">
                            {lesson.challenges.length} tasks
                          </Badge>
                          <Badge variant="xp" size="sm">
                            {lessonXp(lesson)} XP
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {formatDuration(lesson.estimatedMinutes)}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <nav
          aria-label="Track navigation"
          className="mt-14 grid gap-3 border-t border-border-base pt-8 sm:grid-cols-2"
        >
          {previous ? (
            <Card interactive className="p-5">
              <p className="text-xs font-bold tracking-wide text-fg-subtle uppercase">
                Previous track
              </p>
              <Link
                href={`/courses/${previous.slug}`}
                className="mt-1 block text-lg font-extrabold hover:text-brand-500"
              >
                {previous.glyph} {previous.title}
              </Link>
            </Card>
          ) : (
            <div />
          )}

          {next && (
            <Card interactive className="p-5 sm:text-right">
              <p className="text-xs font-bold tracking-wide text-fg-subtle uppercase">
                Next track
              </p>
              <Link
                href={`/courses/${next.slug}`}
                className="mt-1 block text-lg font-extrabold hover:text-brand-500"
              >
                {next.title} {next.glyph}
              </Link>
            </Card>
          )}
        </nav>
      </div>
    </>
  );
}
