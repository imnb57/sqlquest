import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "@/components/lesson/prompt-text";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/learn", label: "Learning path", hint: "Start or continue the course" },
  { href: "/playground", label: "SQL playground", hint: "Run queries against real Postgres" },
  { href: "/sql-cheat-sheet", label: "Cheat sheet", hint: "Syntax reference" },
  { href: "/glossary", label: "Glossary", hint: "Every SQL term explained" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-4 py-5 sm:px-6">
        <Logo />
      </div>

      <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl text-center">
          <p className="font-mono text-7xl font-extrabold text-gradient">404</p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            No rows returned
          </h1>
          <p className="mx-auto mt-3 max-w-md text-fg-muted">
            That page doesn&rsquo;t exist. The good news is you now know exactly
            what an empty result set feels like.
          </p>

          <div className="mx-auto mt-8 max-w-md text-left">
            <CodeBlock
              code={"SELECT * FROM pages\nWHERE url = :requested_url;\n\n-- 0 rows (0.4 ms)"}
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/">
                <Home />
                Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/learn">
                Keep learning
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-12">
            <h2 className="flex items-center justify-center gap-2 eyebrow text-fg-subtle">
              <Search className="size-3.5" />
              Try one of these
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block h-full">
                    <Card interactive className="h-full p-4 text-left">
                      <p className="font-extrabold">{item.label}</p>
                      <p className="mt-0.5 text-sm text-fg-muted">{item.hint}</p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
