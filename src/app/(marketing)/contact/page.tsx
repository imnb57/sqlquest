import type { Metadata } from "next";
import Link from "next/link";
import { Bug, LifeBuoy, Mail, MessageSquare, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { GithubIcon, DiscordIcon } from "@/components/brand/icons";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Report a bug, suggest a lesson, ask a SQL question, or get in touch about using SQLQuest with a class or team.",
  path: "/contact",
});

const CHANNELS = [
  {
    icon: Bug,
    title: "Found a bug?",
    body: "Wrong answer marked correct, a broken lesson, something rendering badly — open an issue with the lesson slug and what you expected.",
    action: "Open a GitHub issue",
    href: "https://github.com/sqlquest/sqlquest/issues/new",
    external: true,
  },
  {
    icon: Sparkles,
    title: "Want a lesson added?",
    body: "Tell us the topic and why it matters. Lessons are plain TypeScript objects, so pull requests are very welcome too.",
    action: "Start a discussion",
    href: "https://github.com/sqlquest/sqlquest/discussions",
    external: true,
  },
  {
    icon: MessageSquare,
    title: "Stuck on a query?",
    body: "The community chat is the fastest route. Paste the question and what you've tried — people are friendly about it.",
    action: "Join the Discord",
    href: siteConfig.social.discord,
    external: true,
  },
  {
    icon: LifeBuoy,
    title: "Using this with a class or team?",
    body: "Happy to help with self-hosting, syllabus mapping, or anything else. Email is the best route for this one.",
    action: siteConfig.contactEmail,
    href: `mailto:${siteConfig.contactEmail}`,
    external: false,
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: `Contact ${siteConfig.name}`,
            url: `${siteConfig.url}/contact`,
          },
        ]}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Get in touch"
          title="Talk to us"
          description="SQLQuest is a small open-source project. There's no support ticket system — just people who read things and reply."
        />

        <ul className="grid gap-5 sm:grid-cols-2">
          {CHANNELS.map(({ icon: Icon, title, body, action, href, external }) => (
            <li key={title}>
              <Card className="flex h-full flex-col p-6">
                <div className="grid size-11 place-items-center rounded-xl bg-brand-500/12">
                  <Icon className="size-5.5 text-brand-500" />
                </div>
                <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">
                  {body}
                </p>
                <a
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand-500 hover:underline"
                >
                  {external ? (
                    href.includes("discord") ? (
                      <DiscordIcon className="size-4" />
                    ) : (
                      <GithubIcon className="size-4" />
                    )
                  ) : (
                    <Mail className="size-4" />
                  )}
                  {action}
                </a>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-border-base bg-bg-subtle p-6">
          <h2 className="font-extrabold">Before you write in</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            A surprising share of questions are already answered in the{" "}
            <Link href="/faq" className="font-bold text-brand-500 hover:underline">
              FAQ
            </Link>{" "}
            — especially anything about grading, privacy or self-hosting. For
            SQL syntax itself, the{" "}
            <Link href="/sql-cheat-sheet" className="font-bold text-brand-500 hover:underline">
              cheat sheet
            </Link>{" "}
            and{" "}
            <Link href="/glossary" className="font-bold text-brand-500 hover:underline">
              glossary
            </Link>{" "}
            are usually faster than waiting for a reply.
          </p>
        </div>
      </div>
    </>
  );
}
