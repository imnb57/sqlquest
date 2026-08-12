"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/lesson/prompt-text";

/**
 * Route-level error boundary.
 *
 * Shows the digest rather than the raw message: in production Next.js
 * redacts server errors anyway, and the digest is what correlates with logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-danger/12">
          <AlertTriangle className="size-8 text-danger" />
        </div>

        <h1 className="mt-5 text-3xl font-extrabold">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">
          An unexpected error broke this page. Your progress is stored in this
          browser and is unaffected — reloading is safe.
        </p>

        {error.digest && (
          <div className="mx-auto mt-6 max-w-sm text-left">
            <CodeBlock
              code={`-- error digest\n${error.digest}`}
              caption="Include this if you report the problem."
            />
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>
            <RotateCcw />
            Try again
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">
              <Home />
              Go home
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-fg-subtle">
          Still broken?{" "}
          <Link href="/contact" className="font-bold text-brand-500 hover:underline">
            Let us know
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
