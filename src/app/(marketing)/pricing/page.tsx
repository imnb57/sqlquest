import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Heart, Server, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/overlays";
import { JsonLd } from "@/components/seo/json-ld";
import { GithubIcon } from "@/components/brand/icons";
import { buildMetadata, faqSchema, breadcrumbSchema } from "@/lib/seo";
import { curriculumStats } from "@/content/curriculum";

export const metadata: Metadata = buildMetadata({
  title: "Pricing — free forever",
  description:
    "SQLQuest is free. Every lesson, every challenge, every feature. No paid tier, no ads, no data selling. Open source under the MIT licence.",
  path: "/pricing",
  keywords: ["free SQL course", "SQL course pricing", "open source SQL learning"],
});

const INCLUDED = [
  `All ${curriculumStats.lessons} lessons and ${curriculumStats.challenges} challenges`,
  "All six tracks, beginner through expert",
  "Real PostgreSQL engine in your browser",
  "XP, levels, streaks, leagues and achievements",
  "The full SQL playground with six datasets",
  "Progress sync across devices",
  "Public profile and leaderboard",
  "Data export at any time",
  "Dark mode, reduced motion, full keyboard access",
];

const NOT_INCLUDED = [
  "Adverts",
  "A premium tier",
  "Upsells or paywalled lessons",
  "Third-party tracking",
  "Selling your data",
];

const PRICING_FAQS = [
  {
    question: "What's the catch?",
    answer:
      "There isn't one. SQLQuest is an open-source project — the code is on GitHub under the MIT licence, and you can run your own copy in about two minutes with Docker. It costs us a small amount to host and nothing to give away, because the SQL engine runs on your machine rather than ours.",
  },
  {
    question: "Will you add a paid tier later?",
    answer:
      "The curriculum will stay free. If we ever add paid features they'd be things organisations want — team dashboards, SSO, private content — never a lesson you can currently do for free being taken away.",
  },
  {
    question: "How do you make money?",
    answer:
      "Right now we don't. The project is maintained by people who wanted this to exist. If it grows, sponsorship and optional team features are the obvious routes — advertising and data sales are not.",
  },
  {
    question: "Can I use this to teach a class?",
    answer:
      "Yes, and please do. The MIT licence permits commercial and educational use. Self-host it if you want your students' progress on your own infrastructure.",
  },
  {
    question: "What are gems for, then?",
    answer:
      "Gems are an in-app currency you earn by learning. They buy heart refills and streak freezes. There is no way to buy them with money, and no plan to add one.",
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={[
          faqSchema(PRICING_FAQS),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <header className="text-center">
          <Badge variant="success" size="lg">
            <Heart className="fill-current" />
            Free forever, and we mean it
          </Badge>
          <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
            One plan. It costs nothing.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
            There is no premium tier to compare this against, because there
            isn&rsquo;t one. Everything SQLQuest does, it does for everybody.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card className="relative overflow-hidden border-2 border-brand-500 p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-brand-500/10 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-sm font-extrabold tracking-widest text-brand-500 uppercase">
                Everything
              </h2>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-6xl font-extrabold">$0</span>
                <span className="text-lg font-bold text-fg-muted">/ forever</span>
              </p>

              <ul className="mt-7 space-y-2.5">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 size-4.5 shrink-0 text-success" strokeWidth={3} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button size="xl" full uppercase className="mt-8" asChild>
                <Link href="/learn">
                  Start learning
                  <ArrowRight />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-fg-subtle">
                No account required. No card. Nothing to cancel.
              </p>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-sm font-extrabold tracking-widest text-fg-subtle uppercase">
                Also not included
              </h2>
              <ul className="mt-4 space-y-2.5">
                {NOT_INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-fg-muted">
                    <X className="mt-0.5 size-4.5 shrink-0 text-danger" strokeWidth={3} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <Server className="size-6 text-brand-500" />
              <h2 className="mt-3 font-extrabold">Self-host it</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                The whole stack ships as a Docker compose file. One command
                gives you SQLQuest plus Postgres on your own machine — useful
                for classrooms and for anywhere the public internet isn&rsquo;t
                an option.
              </p>
              <Button variant="outline" className="mt-4" full asChild>
                <a
                  href="https://github.com/sqlquest/sqlquest"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <GithubIcon />
                  View the source
                </a>
              </Button>
            </Card>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-center text-3xl font-extrabold">
            The questions people actually ask
          </h2>
          <Accordion type="single" collapsible className="mx-auto mt-8 max-w-3xl">
            {PRICING_FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </>
  );
}
