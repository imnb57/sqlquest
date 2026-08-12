import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";
import { allLessons, tracks } from "@/content/curriculum";
import { posts } from "@/content/blog";
import { glossary, termSlug } from "@/content/glossary";
import { capstones } from "@/content/capstones";

/**
 * Sitemap.
 *
 * Priorities reflect how much each page is worth to a search engine, not how
 * much we like it: entry points and evergreen reference pages rank highest,
 * legal boilerplate lowest. Every URL here is statically generated, so
 * `lastModified` is build time except for dated content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: absoluteUrl("/"), priority: 1, changeFrequency: "weekly" },
      { url: absoluteUrl("/learn"), priority: 0.9, changeFrequency: "weekly" },
      { url: absoluteUrl("/courses"), priority: 0.9, changeFrequency: "weekly" },
      { url: absoluteUrl("/playground"), priority: 0.9, changeFrequency: "monthly" },
      { url: absoluteUrl("/sql-cheat-sheet"), priority: 0.85, changeFrequency: "monthly" },
      { url: absoluteUrl("/sql-interview-questions"), priority: 0.85, changeFrequency: "monthly" },
      { url: absoluteUrl("/glossary"), priority: 0.8, changeFrequency: "monthly" },
      { url: absoluteUrl("/blog"), priority: 0.8, changeFrequency: "weekly" },
      { url: absoluteUrl("/projects"), priority: 0.85, changeFrequency: "monthly" },
      { url: absoluteUrl("/tools/diagram"), priority: 0.85, changeFrequency: "monthly" },
      { url: absoluteUrl("/practice"), priority: 0.7, changeFrequency: "monthly" },
      { url: absoluteUrl("/pricing"), priority: 0.7, changeFrequency: "monthly" },
      { url: absoluteUrl("/about"), priority: 0.6, changeFrequency: "monthly" },
      { url: absoluteUrl("/faq"), priority: 0.6, changeFrequency: "monthly" },
      { url: absoluteUrl("/achievements"), priority: 0.5, changeFrequency: "monthly" },
      { url: absoluteUrl("/leaderboard"), priority: 0.5, changeFrequency: "daily" },
      { url: absoluteUrl("/changelog"), priority: 0.4, changeFrequency: "monthly" },
      { url: absoluteUrl("/contact"), priority: 0.4, changeFrequency: "yearly" },
      { url: absoluteUrl("/accessibility"), priority: 0.3, changeFrequency: "yearly" },
      { url: absoluteUrl("/privacy"), priority: 0.3, changeFrequency: "yearly" },
      { url: absoluteUrl("/terms"), priority: 0.3, changeFrequency: "yearly" },
      { url: absoluteUrl("/cookies"), priority: 0.3, changeFrequency: "yearly" },
    ] satisfies Omit<MetadataRoute.Sitemap[number], "lastModified">[]
  ).map((entry) => ({ ...entry, lastModified: now }));

  const trackPages: MetadataRoute.Sitemap = tracks.map((track) => ({
    url: absoluteUrl(`/courses/${track.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const lessonPages: MetadataRoute.Sitemap = allLessons.map(({ lesson }) => ({
    url: absoluteUrl(`/learn/${lesson.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: lesson.kind === "boss" ? 0.7 : 0.65,
  }));

  const capstonePages: MetadataRoute.Sitemap = capstones.map((c) => ({
    url: absoluteUrl(`/projects/${c.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updated ?? post.published),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const glossaryPages: MetadataRoute.Sitemap = glossary.map((entry) => ({
    url: absoluteUrl(`/glossary/${termSlug(entry.term)}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.55,
  }));

  return [
    ...staticPages,
    ...trackPages,
    ...lessonPages,
    ...capstonePages,
    ...blogPages,
    ...glossaryPages,
  ];
}
