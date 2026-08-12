import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "./site";

/**
 * Metadata helpers.
 *
 * Every public page goes through `buildMetadata` so canonical URLs, Open
 * Graph, Twitter cards and robots directives stay consistent — the most
 * common SEO failure on app-shell sites is pages that quietly inherit the
 * homepage's title and canonical.
 */

interface BuildMetadataOptions {
  title: string;
  description: string;
  /** Path only, e.g. "/courses/joins". */
  path: string;
  keywords?: readonly string[];
  /** Overrides the generated OG image. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  /** Keep the page out of the index (login, settings, etc.). */
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  keywords,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  noIndex,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ?? `/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    keywords: [...(keywords ?? []), ...siteConfig.keywords].slice(0, 20),
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@sqlquest",
    },
  };
}

/* ------------------------------------------------------------- structured */

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    description: siteConfig.description,
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.x,
      siteConfig.social.discord,
      siteConfig.social.youtube,
    ],
  };
}

export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function courseSchema(opts: {
  name: string;
  description: string;
  path: string;
  level: string;
  hours: number;
  lessons: number;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      sameAs: siteConfig.url,
    },
    educationalLevel: opts.level,
    inLanguage: "en",
    isAccessibleForFree: true,
    teaches: "SQL",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Free",
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${Math.max(1, Math.round(opts.hours))}H`,
      instructor: { "@type": "Organization", name: siteConfig.name },
    },
    numberOfCredits: opts.lessons,
  };
}

export function learningResourceSchema(opts: {
  name: string;
  description: string;
  path: string;
  level: string;
  minutes: number;
  keywords: readonly string[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    learningResourceType: "Interactive lesson",
    educationalLevel: opts.level,
    timeRequired: `PT${Math.max(1, opts.minutes)}M`,
    teaches: "SQL",
    inLanguage: "en",
    isAccessibleForFree: true,
    keywords: opts.keywords.join(", "),
    provider: { "@type": "Organization", name: siteConfig.name },
  };
}

export function faqSchema(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  path: string;
  published: string;
  modified?: string;
  author: string;
  tags?: readonly string[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    datePublished: opts.published,
    dateModified: opts.modified ?? opts.published,
    author: { "@type": "Person", name: opts.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(opts.path) },
    ...(opts.tags ? { keywords: opts.tags.join(", ") } : {}),
  };
}

export function softwareApplicationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any (web browser)",
    description: siteConfig.description,
    url: siteConfig.url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    // Deliberately no aggregateRating: inventing review counts is both against
    // Google's structured-data policy and a lie to users. Add it once you have
    // real reviews to point at.
  };
}
