import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { glossary, glossaryCategories, termSlug } from "@/content/glossary";

export const metadata: Metadata = buildMetadata({
  title: "SQL glossary — every term explained",
  description: `${glossary.length} SQL terms defined in plain English, each with a runnable example: JOIN, NULL, CTE, window function, sargable, fan-out, keyset pagination and more.`,
  path: "/glossary",
  keywords: [
    "SQL glossary",
    "SQL terms",
    "SQL definitions",
    "what is a CTE",
    "what is a window function",
    "SQL vocabulary",
  ],
});

export default function GlossaryPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Glossary", path: "/glossary" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "SQL Glossary",
            url: absoluteUrl("/glossary"),
            hasDefinedTerm: glossary.map((entry) => ({
              "@type": "DefinedTerm",
              name: entry.term,
              description: entry.short,
              url: absoluteUrl(`/glossary/${termSlug(entry.term)}`),
            })),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Reference"
          title="SQL glossary"
          description={`${glossary.length} terms defined in plain English — each with why it matters, a runnable example, and a link to the lesson that teaches it properly.`}
        />

        <nav aria-label="Categories" className="mb-10 flex flex-wrap gap-2">
          {glossaryCategories.map((category) => (
            <a
              key={category}
              href={`#${category.toLowerCase()}`}
              className="rounded-full border border-border-base px-3.5 py-1.5 text-sm font-bold text-fg-muted transition-colors hover:border-brand-500 hover:text-brand-500"
            >
              {category}
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          {glossaryCategories.map((category) => (
            <section key={category} id={category.toLowerCase()} className="scroll-mt-24">
              <h2 className="text-xs font-extrabold tracking-widest text-brand-500 uppercase">
                {category}
              </h2>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {glossary
                  .filter((entry) => entry.category === category)
                  .map((entry) => (
                    <li key={entry.term}>
                      <Link
                        href={`/glossary/${termSlug(entry.term)}`}
                        className="block h-full"
                      >
                        <Card interactive className="h-full p-5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="font-mono text-base font-extrabold">
                              {entry.term}
                            </h3>
                            {entry.aliases?.slice(0, 2).map((alias) => (
                              <Badge key={alias} variant="neutral" size="sm">
                                {alias}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                            {entry.short}
                          </p>
                        </Card>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
