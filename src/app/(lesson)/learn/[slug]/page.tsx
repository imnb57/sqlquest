import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonPlayer } from "@/components/lesson/lesson-player";
import { JsonLd } from "@/components/seo/json-ld";
import { allLessons, getLessonBySlug, getNextLesson } from "@/content/curriculum";
import { buildMetadata, breadcrumbSchema, learningResourceSchema } from "@/lib/seo";

/**
 * Lesson pages are statically generated: the curriculum is compile-time data,
 * so every lesson ships as HTML with its concepts already in the markup. That
 * makes them genuinely indexable rather than an empty app shell.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return allLessons.map(({ lesson }) => ({ slug: lesson.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ref = getLessonBySlug(slug);
  if (!ref) return { title: "Lesson not found" };

  const { lesson, track } = ref;

  return buildMetadata({
    title: `${lesson.title} — ${track.title}`,
    description: `${lesson.subtitle}. ${lesson.objective}. Interactive SQL lesson with ${lesson.challenges.length} hands-on challenges running on a real Postgres engine in your browser.`,
    path: `/learn/${lesson.slug}`,
    keywords: lesson.keywords,
  });
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const ref = getLessonBySlug(slug);
  if (!ref) notFound();

  const next = getNextLesson(slug);
  const { lesson, unit, track } = ref;

  return (
    <>
      <JsonLd
        data={[
          learningResourceSchema({
            name: lesson.title,
            description: lesson.subtitle,
            path: `/learn/${lesson.slug}`,
            level: track.level,
            minutes: lesson.estimatedMinutes,
            keywords: lesson.keywords,
          }),
          breadcrumbSchema([
            { name: "Courses", path: "/courses" },
            { name: track.title, path: `/courses/${track.slug}` },
            { name: unit.title, path: `/courses/${track.slug}#${unit.slug}` },
            { name: lesson.title, path: `/learn/${lesson.slug}` },
          ]),
        ]}
      />
      <LessonPlayer lessonRef={ref} next={next} />
    </>
  );
}
