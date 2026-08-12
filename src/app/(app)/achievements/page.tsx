import type { Metadata } from "next";
import { AchievementsView } from "@/components/gamification/achievements-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Achievements",
  description:
    "Every badge in SQLQuest — progress milestones, streak awards, mastery challenges and a few secret ones.",
  path: "/achievements",
});

export default function AchievementsPage() {
  return <AchievementsView />;
}
