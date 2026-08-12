/**
 * Single source of truth for branding + SEO constants.
 */

export const siteConfig = {
  name: "SQLQuest",
  tagline: "Learn SQL by playing",
  description:
    "Master SQL from your first SELECT to window functions, CTEs and query tuning. 300+ bite-sized challenges run on a real Postgres engine in your browser — free, open source, no setup.",
  shortDescription:
    "Gamified SQL course with a real Postgres engine in your browser. Free and open source.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000",
  locale: "en_US",
  themeColor: "#7c3aed",
  keywords: [
    "learn SQL",
    "SQL tutorial",
    "SQL course",
    "interactive SQL",
    "SQL practice",
    "PostgreSQL tutorial",
    "SQL exercises",
    "gamified learning",
    "window functions",
    "CTE tutorial",
    "SQL interview questions",
    "database course",
    "free SQL course",
  ],
  author: {
    name: "The SQLQuest Team",
    url: "https://github.com/sqlquest",
  },
  social: {
    github: "https://github.com/sqlquest/sqlquest",
    x: "https://x.com/sqlquest",
    discord: "https://discord.gg/sqlquest",
    youtube: "https://youtube.com/@sqlquest",
  },
  contactEmail: "hello@sqlquest.dev",
} as const;

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Marketing nav — also feeds the footer sitemap block. */
export const marketingNav = [
  { title: "Courses", href: "/courses" },
  { title: "Playground", href: "/playground" },
  { title: "Pricing", href: "/pricing" },
  { title: "Blog", href: "/blog" },
  { title: "Cheat sheet", href: "/sql-cheat-sheet" },
] as const;

export const footerNav = [
  {
    title: "Learn",
    links: [
      { title: "All courses", href: "/courses" },
      { title: "SQL Foundations", href: "/courses/foundations" },
      { title: "Joins & Relationships", href: "/courses/joins" },
      { title: "Aggregation & Grouping", href: "/courses/aggregation" },
      { title: "Advanced SQL", href: "/courses/advanced" },
      { title: "Performance & Tuning", href: "/courses/performance" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "SQL cheat sheet", href: "/sql-cheat-sheet" },
      { title: "SQL glossary", href: "/glossary" },
      { title: "Interview questions", href: "/sql-interview-questions" },
      { title: "Playground", href: "/playground" },
      { title: "Blog", href: "/blog" },
      { title: "RSS feed", href: "/rss.xml" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About", href: "/about" },
      { title: "Pricing", href: "/pricing" },
      { title: "Contact", href: "/contact" },
      { title: "FAQ", href: "/faq" },
      { title: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy policy", href: "/privacy" },
      { title: "Terms of service", href: "/terms" },
      { title: "Cookie policy", href: "/cookies" },
      { title: "Accessibility", href: "/accessibility" },
    ],
  },
] as const;
