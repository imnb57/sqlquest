import { AlertTriangle, Info, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  InlineMarkdown,
  CodeBlock,
  stripInlineMarkdown,
} from "@/components/lesson/prompt-text";
import type { Block } from "@/content/blog";

const CALLOUT = {
  info: { icon: Info, className: "border-aqua-500/35 bg-aqua-500/8", text: "text-aqua-600 dark:text-aqua-300" },
  tip: { icon: Lightbulb, className: "border-lime-accent-500/40 bg-lime-accent-400/10", text: "text-lime-accent-600" },
  warning: { icon: AlertTriangle, className: "border-warning/45 bg-warning/10", text: "text-warning" },
} as const;

/** Renders a post's block list. Server component — zero client JS. */
export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={slugify(stripInlineMarkdown(block.text))}
                className="scroll-mt-24 pt-4 text-2xl font-extrabold sm:text-3xl"
              >
                <InlineMarkdown>{block.text}</InlineMarkdown>
              </h2>
            );

          case "h3":
            return (
              <h3
                key={i}
                id={slugify(stripInlineMarkdown(block.text))}
                className="scroll-mt-24 pt-2 text-xl font-extrabold"
              >
                <InlineMarkdown>{block.text}</InlineMarkdown>
              </h3>
            );

          case "p":
            return (
              <p key={i} className="text-base leading-relaxed text-fg-muted">
                <InlineMarkdown>{block.text}</InlineMarkdown>
              </p>
            );

          case "code":
            return <CodeBlock key={i} code={block.sql} caption={block.caption} />;

          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={i}
                className={cn(
                  "ml-5 space-y-2.5 text-base leading-relaxed text-fg-muted",
                  block.ordered ? "list-decimal" : "list-disc",
                  "marker:font-bold marker:text-brand-500",
                )}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="pl-1.5">
                    <InlineMarkdown>{item}</InlineMarkdown>
                  </li>
                ))}
              </List>
            );
          }

          case "callout": {
            const style = CALLOUT[block.tone];
            const Icon = style.icon;
            return (
              <aside key={i} className={cn("rounded-2xl border p-5", style.className)}>
                <h4 className={cn("flex items-center gap-2 font-extrabold", style.text)}>
                  <Icon className="size-4.5" />
                  <InlineMarkdown>{block.title}</InlineMarkdown>
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  <InlineMarkdown>{block.text}</InlineMarkdown>
                </p>
              </aside>
            );
          }

          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-brand-500 py-1 pl-5 text-lg leading-relaxed font-semibold text-fg italic"
              >
                <InlineMarkdown>{block.text}</InlineMarkdown>
              </blockquote>
            );
        }
      })}
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Table of contents built from the h2s. */
export function PostToc({ blocks }: { blocks: Block[] }) {
  const headings = blocks.filter((b) => b.type === "h2");
  if (headings.length < 3) return null;

  return (
    <nav aria-label="On this page" className="rounded-2xl border border-border-base p-5">
      <h2 className="eyebrow text-fg-subtle">
        On this page
      </h2>
      <ol className="mt-3 space-y-2">
        {headings.map((h, i) => (
          <li key={i}>
            <a
              href={`#${slugify(stripInlineMarkdown(h.text))}`}
              className="text-sm font-semibold text-fg-muted transition-colors hover:text-brand-500"
            >
              {stripInlineMarkdown(h.text)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
