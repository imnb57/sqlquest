import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = buildMetadata({
  title: "Dashboard",
  description: "Your SQL progress, streak, XP history and achievements.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardPage() {
  return <DashboardView />;
}
