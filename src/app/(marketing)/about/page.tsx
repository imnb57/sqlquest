import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Eye, Heart, Layers } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prose, PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { GithubIcon } from "@/components/brand/icons";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { curriculumStats } from "@/content/curriculum";

export const metadata: Metadata = buildMetadata({
  title: "About SQLQuest",
  description:
    "Why we built a free, open-source, gamified SQL course that runs a real PostgreSQL engine in your browser — and the principles behind how it teaches.",
  path: "/about",
});

const PRINCIPLES = [
  {
    icon: Cpu,
    title: "Real tools, from lesson one",
    body: "You learn on actual PostgreSQL, not a simplified imitation. Real error messages, real NULL semantics, real query plans. Nothing you learn here needs unlearning later.",
  },
  {
    icon: Layers,
    title: "Doing beats reading",
    body: "Every concept is at most two minutes of explanation followed immediately by writing SQL yourself. Recognition feels like learning; only retrieval actually is.",
  },
  {
    icon: Eye,
    title: "Honest feedback",
    body: "When you're wrong, we say what's wrong — 24 rows instead of 16, a join fanning out, a filter that's excluding NULLs. Generic 'incorrect' teaches nothing.",
  },
  {
    icon: Heart,
    title: "Game mechanics used honestly",
    body: "Streaks and XP are here to build a habit, not to manufacture anxiety or sell you a subscription. Hearts can be switched off entirely in settings.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="About"
          title="SQL should be easier to learn than this"
          description="It's the most widely useful language most people never quite get around to learning properly — and the way it's usually taught is a large part of why."
        />

        <Prose>
          <h2>The problem</h2>
          <p>
            Almost everyone who works near data eventually needs SQL. Analysts,
            engineers, product managers, founders, scientists. It&rsquo;s been
            the interface to the world&rsquo;s data for fifty years and it
            isn&rsquo;t going anywhere.
          </p>
          <p>
            And yet learning it usually means one of three bad options: a
            textbook that never lets you touch a database; a video course you
            watch passively and forget; or setting up Postgres locally, which
            defeats a lot of people before they&rsquo;ve written a single{" "}
            <code>SELECT</code>.
          </p>
          <p>
            The interactive tools that do exist tend to check your answer by
            comparing strings against one blessed solution — so a perfectly
            correct query written differently is marked wrong, and you learn to
            guess the author&rsquo;s style rather than the language.
          </p>

          <h2>What we built instead</h2>
          <p>
            SQLQuest compiles PostgreSQL to WebAssembly and runs it inside your
            browser tab. That one decision fixes most of the problems at once:
          </p>
          <ul>
            <li>
              <strong>Nothing to install.</strong> Open a lesson, start typing.
            </li>
            <li>
              <strong>Real behaviour.</strong> Genuine error messages, genuine{" "}
              <code>EXPLAIN ANALYZE</code> output, genuine NULL semantics.
            </li>
            <li>
              <strong>Honest grading.</strong> Your query and the reference
              solution run against identical data and the result sets are
              compared — so any correct approach passes.
            </li>
            <li>
              <strong>Total privacy.</strong> There is no server evaluating your
              SQL, because there is no server involved at all.
            </li>
            <li>
              <strong>Instant feedback.</strong> Queries return in single-digit
              milliseconds. No network hop, no rate limit, no queue.
            </li>
          </ul>

          <h2>How it teaches</h2>
          <p>
            The curriculum is {curriculumStats.lessons} lessons across six
            tracks, roughly {Math.round(curriculumStats.totalMinutes / 60)}{" "}
            hours of material. It starts at &ldquo;what is a SELECT&rdquo; and
            ends at composite index design and reading execution plans.
          </p>
          <p>
            Each lesson is a short explanation followed by{" "}
            {Math.round(curriculumStats.challenges / curriculumStats.lessons)}{" "}
            or so challenges in six different formats. Multiple-choice and
            predict-the-output exercise recognition; writing queries, filling
            blanks and finding bugs exercise recall. Mixing them is what makes
            the material stick — and it means the app is genuinely usable on a
            phone, where writing long queries isn&rsquo;t practical.
          </p>

          <h2>Open source</h2>
          <p>
            The whole thing is MIT-licensed on GitHub. You can read how the
            grader works, fork it, run it on your own hardware, or contribute a
            lesson. Every reference solution is executed against a real database
            in CI, so a broken lesson physically cannot be merged.
          </p>
        </Prose>

        <h2 className="mt-12 text-2xl font-extrabold">What we optimise for</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full p-5">
                <div className="grid size-10 place-items-center rounded-xl bg-brand-500/12">
                  <Icon className="size-5 text-brand-500" />
                </div>
                <h3 className="mt-3 font-extrabold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{body}</p>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/learn">
              Start the course
              <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/sqlquest/sqlquest"
              target="_blank"
              rel="noreferrer noopener"
            >
              <GithubIcon />
              Read the source
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}
