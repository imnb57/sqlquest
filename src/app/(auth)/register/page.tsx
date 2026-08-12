import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMetadata } from "@/lib/seo";
import { oauthProviders } from "@/lib/auth/config";

export const metadata: Metadata = buildMetadata({
  title: "Create a free account",
  description:
    "Create a free SQLQuest account to sync progress across devices, appear on the leaderboard and keep your streak safe.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[36rem] w-full max-w-md rounded-2xl" />}>
      <AuthForm mode="register" oauth={oauthProviders} />
    </Suspense>
  );
}
