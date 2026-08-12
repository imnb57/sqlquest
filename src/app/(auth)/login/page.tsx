import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMetadata } from "@/lib/seo";
import { oauthProviders } from "@/lib/auth/config";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to sync your SQLQuest progress across devices.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[30rem] w-full max-w-md rounded-2xl" />}>
      <AuthForm mode="login" oauth={oauthProviders} />
    </Suspense>
  );
}
