import type { Metadata } from "next";
import { LeaderboardView } from "@/components/gamification/leaderboard-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Leaderboard",
  description:
    "See who's putting in the XP this week. Leagues promote the top learners every Monday.",
  path: "/leaderboard",
});

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
