import type { Metadata } from "next";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, faqSchema, breadcrumbSchema } from "@/lib/seo";
import { ALL_FAQS } from "@/content/faqs";

export const metadata: Metadata = buildMetadata({
  title: "Frequently asked questions",
  description:
    "Everything about how SQLQuest works: grading, the in-browser Postgres engine, accounts, privacy, self-hosting and contributing.",
  path: "/faq",
  keywords: ["SQLQuest FAQ", "learn SQL questions", "SQL course FAQ"],
});

export default function FaqPage() {
  const categories = Array.from(
    new Set(ALL_FAQS.map((f) => f.category ?? "General")),
  );

  return (
    <>
      <JsonLd
        data={[
          faqSchema(ALL_FAQS),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Support"
          title="Frequently asked questions"
          description="If your question isn't here, the contact page reaches a human."
        />

        <div className="space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-xs font-extrabold tracking-widest text-brand-500 uppercase">
                {category}
              </h2>
              <Accordion type="single" collapsible className="mt-3">
                {ALL_FAQS.filter((f) => (f.category ?? "General") === category).map(
                  (faq) => (
                    <AccordionItem key={faq.question} value={faq.question}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ),
                )}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border-base bg-bg-subtle p-7 text-center">
          <h2 className="text-xl font-extrabold">Still stuck?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Ask on GitHub Discussions or drop us a line — questions about the
            SQL itself are welcome too.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/glossary">Browse the glossary</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
