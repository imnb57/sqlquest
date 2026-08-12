import type { Metadata } from "next";
import { StatsView } from "@/components/dashboard/stats-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Statistics",
  description:
    "A detailed breakdown of your SQL progress: accuracy by track, performance by challenge type, and your full activity history.",
  path: "/stats",
  noIndex: true,
});

export default function StatsPage() {
  return <StatsView />;
}
