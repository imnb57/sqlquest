import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { curriculumStats } from "@/content/curriculum";

export const metadata: Metadata = buildMetadata({
  title: "Changelog",
  description:
    "What's new in SQLQuest — new tracks, new challenge types, and the fixes that came out of learner reports.",
  path: "/changelog",
});

interface Release {
  version: string;
  date: string;
  title: string;
  tag: "major" | "minor" | "patch";
  changes: { type: "new" | "improved" | "fixed"; text: string }[];
}

const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "2026-06-01",
    title: "First public release",
    tag: "major",
    changes: [
      {
        type: "new",
        text: `The full curriculum: 6 tracks, ${curriculumStats.lessons} lessons and ${curriculumStats.challenges} challenges, from SELECT to execution plans.`,
      },
      {
        type: "new",
        text: "PostgreSQL compiled to WebAssembly, running in a dedicated Web Worker so a slow query never freezes the page.",
      },
      {
        type: "new",
        text: "Result-set grading: your query and the reference solution execute against identical data and the outputs are compared, so any correct approach passes.",
      },
      {
        type: "new",
        text: "Six challenge formats — write a query, multiple choice, predict the output, fill the blanks, reorder clauses, find the bug.",
      },
      {
        type: "new",
        text: "Gamification: 60 levels across 7 ranks, streaks with freezes, hearts, gems, daily quests, 6 leagues and 26 achievements.",
      },
      {
        type: "new",
        text: "SQL playground with six datasets, query history and a live schema browser.",
      },
      {
        type: "new",
        text: "Local-first progress — the entire course works signed out and offline; accounts add cross-device sync.",
      },
      {
        type: "new",
        text: "Dashboard with an activity heatmap, XP history, per-track accuracy and a per-question-type breakdown.",
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-05-12",
    title: "Performance track & content gate",
    tag: "minor",
    changes: [
      {
        type: "new",
        text: "Performance & Tuning track: EXPLAIN ANALYZE, index design, and the anti-patterns that defeat the planner.",
      },
      {
        type: "new",
        text: "The `warehouse` dataset — 50,000 generated shipments, big enough that plan choices actually matter.",
      },
      {
        type: "new",
        text: "CI now executes every reference solution against a real database, so a broken lesson can't be merged.",
      },
      {
        type: "improved",
        text: "Grader error messages rewritten in plain language — 'there's no column called x' rather than raw SQLSTATE.",
      },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-04-20",
    title: "Accessibility pass",
    tag: "minor",
    changes: [
      {
        type: "new",
        text: "Reorder challenges gained explicit up/down buttons so drag-and-drop is never the only route.",
      },
      {
        type: "new",
        text: "In-app reduce-motion toggle, on top of the existing prefers-reduced-motion support.",
      },
      {
        type: "improved",
        text: "Answer feedback is announced via a live region for screen readers.",
      },
      {
        type: "improved",
        text: "Every heatmap cell now carries its exact XP and date as an accessible name.",
      },
      { type: "fixed", text: "Focus was lost after closing the out-of-hearts dialog." },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-03-28",
    title: "Advanced SQL track",
    tag: "minor",
    changes: [
      {
        type: "new",
        text: "Window functions, recursive CTEs and set operations, ending in an interview-question checkpoint.",
      },
      { type: "new", text: "The `org` and `telemetry` datasets." },
      {
        type: "improved",
        text: "Row-order checking is now inferred from the reference solution, so only questions that ask for an order enforce one.",
      },
      {
        type: "fixed",
        text: "Numeric comparison no longer failed correct AVG() answers because of floating-point noise.",
      },
    ],
  },
];

const TYPE_STYLE = {
  new: { label: "New", variant: "success" as const },
  improved: { label: "Improved", variant: "aqua" as const },
  fixed: { label: "Fixed", variant: "warning" as const },
};

export default function ChangelogPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Changelog", path: "/changelog" },
        ])}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Product"
          title="Changelog"
          description="Everything that's shipped, newest first."
        />

        <ol className="space-y-12">
          {RELEASES.map((release) => (
            <li key={release.version} className="relative pl-8">
              <span
                aria-hidden="true"
                className="absolute top-2 left-0 size-3 rounded-full bg-brand-500 ring-4 ring-brand-500/20"
              />
              <span
                aria-hidden="true"
                className="absolute top-6 bottom-[-3rem] left-[5px] w-px bg-border-base last:hidden"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-extrabold">v{release.version}</h2>
                <Badge
                  variant={release.tag === "major" ? "solid" : "neutral"}
                  size="sm"
                >
                  {release.tag}
                </Badge>
                <time
                  dateTime={release.date}
                  className="text-sm font-semibold text-fg-subtle"
                >
                  {new Date(release.date).toLocaleDateString("en", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>

              <p className="mt-1 text-lg font-bold text-fg-muted">
                {release.title}
              </p>

              <ul className="mt-4 space-y-2.5">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex gap-3">
                    <Badge
                      variant={TYPE_STYLE[change.type].variant}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    >
                      {TYPE_STYLE[change.type].label}
                    </Badge>
                    <span className="text-sm leading-relaxed text-fg-muted">
                      {change.text}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
