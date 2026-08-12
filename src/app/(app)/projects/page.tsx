import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { CapstoneProgressPill } from "@/components/capstone/capstone-progress-pill";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { formatDuration } from "@/lib/utils";
import { capstones, capstoneStats } from "@/content/capstones";
import { capstoneXp } from "@/content/capstone-types";

export const metadata: Metadata = buildMetadata({
  title: "SQL capstone projects",
  description: `${capstoneStats.projects} realistic SQL projects with ${capstoneStats.milestones} graded milestones — a revenue report, a product activation audit and a database performance investigation. Build a portfolio, not just exercises.`,
  path: "/projects",
  keywords: [
    "SQL projects",
    "SQL portfolio project",
    "SQL practice project",
    "data analyst project",
    "SQL capstone",
  ],
});

export default function ProjectsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Capstone projects</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">
            Lessons tell you what to write. A project hands you a business
            problem, a database and a brief, and expects you to work out the SQL
            yourself. Each milestone is graded the same way a challenge is — by
            running it — so what you finish with is real, reproducible work.
          </p>
        </header>

        <ul className="space-y-5">
          {capstones.map((capstone) => (
            <li key={capstone.id}>
              <Card interactive className="overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl ${capstone.accent}`}
                        aria-hidden="true"
                      >
                        {capstone.glyph}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-xl font-extrabold">
                          <Link
                            href={`/projects/${capstone.slug}`}
                            className="hover:text-brand-500"
                          >
                            {capstone.title}
                          </Link>
                        </h2>
                        <p className="text-sm text-fg-muted">{capstone.subtitle}</p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        capstone.difficulty === "medium"
                          ? "warning"
                          : capstone.difficulty === "hard"
                            ? "danger"
                            : "solid"
                      }
                    >
                      {capstone.difficulty}
                    </Badge>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                    {capstone.scenario}
                  </p>

                  <div className="mt-5">
                    <p className="eyebrow text-fg-subtle">You&rsquo;ll deliver</p>
                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {capstone.deliverables.map((d) => (
                        <li key={d} className="flex gap-2 text-sm text-fg-muted">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <CapstoneProgressPill
                    capstoneId={capstone.id}
                    total={capstone.milestones.length}
                    className="mt-5"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-base bg-bg-subtle px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      <Target />
                      {capstone.milestones.length} milestones
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      <Clock />
                      {formatDuration(capstone.estimatedMinutes)}
                    </Badge>
                    <Badge variant="xp" size="sm">
                      {capstoneXp(capstone)} XP
                    </Badge>
                  </div>

                  <Button asChild>
                    <Link href={`/projects/${capstone.slug}`}>
                      Open project
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
