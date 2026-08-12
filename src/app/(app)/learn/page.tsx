import type { Metadata } from "next";
import { SkillTree } from "@/components/learn/skill-tree";
import { ContinueBanner } from "@/components/learn/continue-banner";
import { LocalOnlyNotice } from "@/components/layout/user-menu";
import { curriculumStats } from "@/content/curriculum";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Your learning path",
  description:
    "Follow the SQLQuest path from your first SELECT through joins, aggregation, window functions and query tuning.",
  path: "/learn",
  noIndex: true,
});

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Learning path</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {curriculumStats.lessons} lessons · {curriculumStats.challenges}{" "}
          challenges · {curriculumStats.totalXp.toLocaleString()} XP available
        </p>
      </header>

      <ContinueBanner className="mb-8" />
      <LocalOnlyNotice className="mb-8" />

      <SkillTree />
    </div>
  );
}
