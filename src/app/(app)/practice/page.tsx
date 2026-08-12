import type { Metadata } from "next";
import { PracticeView } from "@/components/practice/practice-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Practice SQL",
  description:
    "Review the lessons you found hardest, replay anything you've finished, and keep your SQL sharp. No hearts, no pressure.",
  path: "/practice",
  keywords: ["SQL practice", "SQL exercises", "SQL drills", "spaced repetition SQL"],
});

export default function PracticePage() {
  return <PracticeView />;
}
