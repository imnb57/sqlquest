import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeBlock, InlineMarkdown } from "@/components/lesson/prompt-text";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { glossary, getTerm, termSlug } from "@/content/glossary";
import { getLessonBySlug } from "@/content/curriculum";

export const dynamicParams = false;

export function generateStaticParams() {
  return glossary.map((entry) => ({ term: termSlug(entry.term) }));
}

type Props = { params: Promise<{ term: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term } = await params;
  const entry = getTerm(term);
  if (!entry) return { title: "Term not found" };

  return buildMetadata({
    title: `${entry.term} in SQL — what it means`,
    description: entry.short,
    path: `/glossary/${termSlug(entry.term)}`,
    keywords: [
      `SQL ${entry.term}`,
      `what is ${entry.term}`,
      ...(entry.aliases ?? []),
      `${entry.term} example`,
    ],
  });
}

export default async function TermPage({ params }: Props) {
  const { term } = await params;
  const entry = getTerm(term);
  if (!entry) notFound();

  const lesson = entry.lesson ? getLessonBySlug(entry.lesson) : undefined;
  const related = (entry.related ?? [])
    .map((name) => glossary.find((g) => g.term === name))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: entry.term,
            description: entry.short,
            url: absoluteUrl(`/glossary/${termSlug(entry.term)}`),
            inDefinedTermSet: {
              "@type": "DefinedTermSet",
              name: "SQL Glossary",
              url: absoluteUrl("/glossary"),
            },
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Glossary", path: "/glossary" },
            { name: entry.term, path: `/glossary/${termSlug(entry.term)}` },
          ]),
        ]}
      />

      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <Link
          href="/glossary"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-fg-muted transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="size-4" />
          Glossary
        </Link>

        <header className="mt-6">
          <Badge variant="default">{entry.category}</Badge>
          <h1 className="mt-3 font-mono text-4xl font-extrabold sm:text-5xl">
            {entry.term}
          </h1>

          {entry.aliases && entry.aliases.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
              Also known as
              {entry.aliases.map((alias) => (
                <Badge key={alias} variant="neutral" size="sm">
                  {alias}
                </Badge>
              ))}
            </p>
          )}

          <p className="mt-5 text-xl leading-relaxed font-semibold">
            {entry.short}
          </p>
        </header>

        <div className="mt-8 space-y-4">
          {entry.body.map((paragraph, i) => (
            <p key={i} className="leading-relaxed text-fg-muted">
              <InlineMarkdown>{paragraph}</InlineMarkdown>
            </p>
          ))}
        </div>

        {entry.example && (
          <section className="mt-8">
            <h2 className="mb-2 section-label">
              Example
            </h2>
            <CodeBlock code={entry.example.sql} caption={entry.example.caption} />
          </section>
        )}

        {lesson && (
          <Card className="mt-10 flex flex-wrap items-center justify-between gap-4 border-brand-500/40 bg-brand-500/6 p-5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-brand-500 uppercase">
                <BookOpen className="size-3.5" />
                Learn it properly
              </p>
              <h2 className="mt-1 font-extrabold">{lesson.lesson.title}</h2>
              <p className="text-sm text-fg-muted">{lesson.lesson.subtitle}</p>
            </div>
            <Button asChild>
              <Link href={`/learn/${lesson.lesson.slug}`}>
                Open lesson
                <ArrowRight />
              </Link>
            </Button>
          </Card>
        )}

        {related.length > 0 && (
          <section className="mt-10 border-t border-border-base pt-8">
            <h2 className="section-label">
              Related terms
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.term}>
                  <Link href={`/glossary/${termSlug(r.term)}`} className="block h-full">
                    <Card interactive className="h-full p-4">
                      <h3 className="font-mono font-extrabold">{r.term}</h3>
                      <p className="mt-1 text-sm text-fg-muted">{r.short}</p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
