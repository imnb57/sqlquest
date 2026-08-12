import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, User } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { PostBody, PostToc } from "@/components/marketing/post-body";
import { buildMetadata, articleSchema, breadcrumbSchema } from "@/lib/seo";
import { posts, getPost, relatedPosts } from "@/content/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
    type: "article",
    publishedTime: post.published,
    modifiedTime: post.updated ?? post.published,
    authors: [post.author],
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = relatedPosts(slug);

  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            title: post.title,
            description: post.description,
            path: `/blog/${post.slug}`,
            published: post.published,
            modified: post.updated,
            author: post.author,
            tags: post.tags,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-fg-muted transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="size-4" />
          All guides
        </Link>

        <header className="mt-6">
          <span className="text-5xl" aria-hidden="true">
            {post.glyph}
          </span>
          <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            {post.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-fg-subtle">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4" />
              {post.author}
            </span>
            <time
              dateTime={post.published}
              className="inline-flex items-center gap-1.5"
            >
              <CalendarDays className="size-4" />
              {formatDate(post.published)}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {post.readingMinutes} min read
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="neutral">
                #{tag}
              </Badge>
            ))}
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            <PostBody blocks={post.body} />

            <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-7 text-center text-white">
              <h2 className="text-xl font-extrabold">Reading about SQL is the easy part</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm opacity-90">
                Put it into practice against a real Postgres database running
                in your browser. Free, no signup, no setup.
              </p>
              <Button variant="accent" size="lg" className="mt-5" asChild>
                <Link href="/learn">
                  Start the course
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PostToc blocks={post.body} />
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border-base pt-10">
            <h2 className="text-xl font-extrabold">Keep reading</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="block h-full">
                    <Card interactive className="flex h-full flex-col p-5">
                      <span className="text-2xl" aria-hidden="true">
                        {r.glyph}
                      </span>
                      <h3 className="mt-2 font-extrabold">{r.title}</h3>
                      <p className="mt-1.5 flex-1 text-sm text-fg-muted">
                        {r.description}
                      </p>
                      <span className="mt-3 text-sm font-bold text-brand-500">
                        Read →
                      </span>
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
