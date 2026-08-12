import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  Cpu,
  Flame,
  Gauge,

  Lock,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/overlays";
import { JsonLd } from "@/components/seo/json-ld";
import { GithubIcon } from "@/components/brand/icons";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { MascotHero } from "@/components/marketing/mascot-hero";
import { buildMetadata, faqSchema, courseSchema } from "@/lib/seo";
import { curriculumStats, tracks } from "@/content/curriculum";
import { formatDuration } from "@/lib/utils";
import { HOME_FAQS } from "@/content/faqs";

export const metadata: Metadata = buildMetadata({
  title: "Learn SQL by playing — free, gamified, runs real Postgres in your browser",
  description:
    "Master SQL from your first SELECT to window functions and query tuning. 237 hands-on challenges, XP, streaks and leagues. Free, open source, no signup, no setup.",
  path: "/",
});

const FEATURES = [
  {
    icon: Cpu,
    title: "A real database, not a simulator",
    body: "Every query runs against PostgreSQL compiled to WebAssembly, right here in your tab. Real error messages, real query plans, real EXPLAIN ANALYZE output — the same things you'll see at work.",
  },
  {
    icon: Target,
    title: "Graded on results, not string matching",
    body: "Your query and the reference solution execute against identical data and the result sets are compared. Solve it your way; if the rows match, it's right.",
  },
  {
    icon: Flame,
    title: "Built for the ten-minute habit",
    body: "Streaks, daily goals, hearts and leagues — the mechanics that turn 'I should learn SQL' into something you actually do on a Tuesday evening.",
  },
  {
    icon: Braces,
    title: "Six challenge formats",
    body: "Write queries, predict outputs, fill in blanks, reorder clauses, spot the bug. Recall and recognition, not just typing along.",
  },
  {
    icon: Lock,
    title: "Nothing leaves your browser",
    body: "There's no server evaluating your SQL, because there's no server involved at all. Progress is stored locally and only backed up if you choose to make an account.",
  },
  {
    icon: Gauge,
    title: "Goes properly deep",
    body: "Most courses stop at GROUP BY. This one keeps going through CTEs, recursive queries, window frames, index design and reading execution plans.",
  },
];

const STEPS = [
  {
    title: "Learn the idea",
    body: "Short, concrete explanations with runnable examples — never a wall of theory.",
  },
  {
    title: "Do it yourself",
    body: "Write real SQL against a real database and get instant, specific feedback on what went wrong.",
  },
  {
    title: "Keep it",
    body: "Spaced practice, checkpoints and streaks move it from 'I've seen this' to 'I know this'.",
  },
];

export default function HomePage() {
  const hours = Math.round(curriculumStats.totalMinutes / 60);

  return (
    <>
      <JsonLd
        data={[
          faqSchema(HOME_FAQS),
          ...tracks.map((track) =>
            courseSchema({
              name: track.title,
              description: track.description,
              path: `/courses/${track.slug}`,
              level: track.level,
              hours: track.units.reduce(
                (sum, u) =>
                  sum + u.lessons.reduce((s, l) => s + l.estimatedMinutes, 0) / 60,
                0,
              ),
              lessons: track.units.reduce((sum, u) => sum + u.lessons.length, 0),
            }),
          ),
        ]}
      />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="animate-aurora pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/25 via-aqua-400/20 to-lime-accent-400/15 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 pt-14 pb-16 sm:px-6 lg:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="default" size="lg" className="mb-5">
                <Sparkles />
                Free forever · open source · no signup
              </Badge>

              <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl lg:text-6xl">
                Learn SQL by <span className="text-gradient">playing</span>, not by
                reading
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
                {curriculumStats.challenges} bite-sized challenges take you from
                your very first <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[0.9em] font-semibold">SELECT</code>{" "}
                to window functions, recursive CTEs and reading query plans —
                all running on a real PostgreSQL engine inside your browser.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="xl" uppercase asChild>
                  <Link href="/learn">
                    Start learning free
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/playground">Try the playground</Link>
                </Button>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                {[
                  ["Lessons", curriculumStats.lessons],
                  ["Challenges", curriculumStats.challenges],
                  ["Hours of material", `${hours}+`],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs font-bold tracking-wide text-fg-subtle uppercase">
                      {label}
                    </dt>
                    <dd className="text-2xl font-extrabold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- features */}
      <section className="border-t border-border-base bg-bg-subtle py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Why this one actually{" "}
              <span className="underline-sketch">sticks</span>
            </h2>
            <p className="mt-3 text-lg text-fg-muted">
              Most SQL tutorials are a wall of text and a copy-paste box. This is
              a database in your browser and a reason to come back tomorrow.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card interactive className="h-full p-6">
                  <div className="grid size-11 place-items-center rounded-xl bg-brand-500/12">
                    <Icon className="size-5.5 text-brand-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- how it works */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <MascotHero />

            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Learn → do → keep
              </h2>
              <p className="mt-3 text-lg text-fg-muted">
                The loop is deliberately short. You&rsquo;re never more than a
                minute from writing SQL yourself.
              </p>

              <ol className="mt-8 space-y-6">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-extrabold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Button className="mt-8" size="lg" asChild>
                <Link href="/learn">
                  Take the first lesson
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- tracks */}
      <section className="border-t border-border-base bg-bg-subtle py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              The full path, beginner to expert
            </h2>
            <p className="mt-3 text-lg text-fg-muted">
              Six tracks, in order. Start anywhere, but they build on each other.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => {
              const lessons = track.units.reduce((n, u) => n + u.lessons.length, 0);
              const minutes = track.units.reduce(
                (n, u) => n + u.lessons.reduce((m, l) => m + l.estimatedMinutes, 0),
                0,
              );

              return (
                <li key={track.id}>
                  <Card interactive className="flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl" aria-hidden="true">
                        {track.glyph}
                      </span>
                      <Badge
                        variant={
                          track.level === "Beginner"
                            ? "success"
                            : track.level === "Intermediate"
                              ? "aqua"
                              : track.level === "Advanced"
                                ? "default"
                                : "warning"
                        }
                      >
                        {track.level}
                      </Badge>
                    </div>

                    <h3 className="mt-3 text-lg font-extrabold">{track.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">
                      {track.subtitle}
                    </p>

                    <ul className="mt-4 space-y-1.5">
                      {track.outcomes.slice(0, 3).map((outcome) => (
                        <li key={outcome} className="flex gap-2 text-xs text-fg-muted">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                          {outcome}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-center justify-between border-t border-border-base pt-4">
                      <span className="text-xs font-bold text-fg-subtle">
                        {lessons} lessons · {formatDuration(minutes)}
                      </span>
                      <Link
                        href={`/courses/${track.slug}`}
                        className="text-sm font-extrabold text-brand-500 hover:underline"
                      >
                        Explore →
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------ gamification */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              The bit that keeps you coming back
            </h2>
            <p className="mt-3 text-lg text-fg-muted">
              Game mechanics used honestly: to build a habit, not to sell you
              anything. There is no paid tier.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                tone: "text-xp-dark dark:text-xp",
                bg: "bg-xp/15",
                title: "XP & levels",
                body: "60 levels across seven ranks, from Initiate to Grandmaster.",
              },
              {
                icon: Flame,
                tone: "text-streak",
                bg: "bg-streak/15",
                title: "Streaks",
                body: "Daily goals, streak freezes, and XP multipliers that grow with consistency.",
              },
              {
                icon: Trophy,
                tone: "text-brand-500",
                bg: "bg-brand-500/15",
                title: "Leagues",
                body: "Six leagues, weekly promotion. Compete only if you want to.",
              },
              {
                icon: BookOpen,
                tone: "text-success",
                bg: "bg-success/15",
                title: "Achievements",
                body: "26 badges across progress, mastery, exploration — and a few secret ones.",
              },
            ].map(({ icon: Icon, tone, bg, title, body }) => (
              <li key={title}>
                <Card className="h-full p-6 text-center">
                  <div className={`mx-auto grid size-12 place-items-center rounded-2xl ${bg}`}>
                    <Icon className={`size-6 ${tone}`} />
                  </div>
                  <h3 className="mt-4 font-extrabold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="border-t border-border-base bg-bg-subtle py-16 lg:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
            Common questions
          </h2>

          <Accordion type="single" collapsible className="mt-8">
            {HOME_FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="mt-8 text-center text-sm text-fg-muted">
            More in the{" "}
            <Link href="/faq" className="font-bold text-brand-500 hover:underline">
              full FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-center text-white sm:px-12">
            <div
              aria-hidden="true"
              className="animate-aurora pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-aqua-400/30 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Write your first query in 30 seconds
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-lg opacity-90">
                No account, no credit card, no download. Just open a lesson and
                start typing.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="xl" variant="accent" uppercase asChild>
                  <Link href="/learn">
                    Start learning
                    <ArrowRight />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="secondary"
                  className="border-white/25 bg-white/15 text-white hover:bg-white/25"
                  asChild
                >
                  <a
                    href="https://github.com/sqlquest/sqlquest"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <GithubIcon />
                    Star on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
