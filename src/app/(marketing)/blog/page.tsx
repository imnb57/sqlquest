import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Rss } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { sortedPosts, allTags } from "@/content/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "SQL guides & articles",
  description:
    "Practical writing about SQL: joins without Venn diagrams, window functions, NULL semantics, reading Postgres execution plans, and how to actually make it stick.",
  path: "/blog",
  keywords: ["SQL blog", "SQL guides", "SQL tutorials", "postgres articles"],
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  const [featured, ...rest] = sortedPosts;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${siteConfig.name} blog`,
            url: absoluteUrl("/blog"),
            description:
              "Practical writing about SQL, query design and PostgreSQL performance.",
            blogPost: sortedPosts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.published,
              author: { "@type": "Person", name: p.author },
            })),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Guides</h1>
            <p className="mt-3 max-w-2xl text-lg text-fg-muted">
              Longer-form writing on the parts of SQL that are genuinely
              tricky — and the mental models that make them stop being tricky.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/rss.xml">
              <Rss />
              RSS
            </Link>
          </Button>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge key={tag} variant="neutral">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Featured */}
        <Link href={`/blog/${featured.slug}`} className="mt-10 block">
          <Card
            interactive
            className="overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white lg:p-10"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden="true">
                {featured.glyph}
              </span>
              <Badge className="border-white/30 bg-white/20 text-white">
                Latest
              </Badge>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-2 max-w-2xl text-base opacity-90">
              {featured.description}
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-4 text-xs font-bold opacity-85">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDate(featured.published)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {featured.readingMinutes} min read
              </span>
            </p>
          </Card>
        </Link>

        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block h-full">
                <Card interactive className="flex h-full flex-col p-6">
                  <span className="text-3xl" aria-hidden="true">
                    {post.glyph}
                  </span>
                  <h2 className="mt-3 text-lg leading-snug font-extrabold">
                    {post.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
                    {post.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="neutral" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <p className="mt-4 flex items-center gap-3 border-t border-border-base pt-3 text-xs font-bold text-fg-subtle">
                    <span>{formatDate(post.published)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMinutes} min</span>
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
