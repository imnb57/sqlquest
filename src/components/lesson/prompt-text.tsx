import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal inline markdown for lesson copy.
 *
 * Supports `code`, **bold** and *italic* only. A full markdown pipeline would
 * add ~40 KB to every lesson for three formatting marks, and restricting the
 * grammar means authored content can never inject markup.
 */

type Token =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string };

const PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", value: input.slice(lastIndex, index) });
    }
    const raw = match[0];
    if (raw.startsWith("`")) {
      tokens.push({ type: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("**")) {
      tokens.push({ type: "bold", value: raw.slice(2, -2) });
    } else {
      tokens.push({ type: "italic", value: raw.slice(1, -1) });
    }
    lastIndex = index + raw.length;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: "text", value: input.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Removes inline markdown without rendering it — for places that need a plain
 * string (a table of contents, an id, an aria-label) but whose source text is
 * authored with backticks.
 */
export function stripInlineMarkdown(input: string): string {
  return tokenize(input)
    .map((t) => t.value)
    .join("");
}

export function InlineMarkdown({ children }: { children: string }) {
  const tokens = React.useMemo(() => tokenize(children), [children]);

  return (
    <>
      {tokens.map((token, i) => {
        switch (token.type) {
          case "code":
            return (
              <code
                key={i}
                className="rounded-md bg-code-bg px-1.5 py-0.5 font-mono text-[0.875em] font-semibold text-brand-600 dark:text-brand-300"
              >
                {token.value}
              </code>
            );
          case "bold":
            return (
              <strong key={i} className="font-extrabold text-fg">
                {token.value}
              </strong>
            );
          case "italic":
            return (
              <em key={i} className="italic">
                {token.value}
              </em>
            );
          default:
            return <React.Fragment key={i}>{token.value}</React.Fragment>;
        }
      })}
    </>
  );
}

/** Paragraph-aware version: blank lines become separate <p> elements. */
export function PromptText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const paragraphs = children.split(/\n\s*\n/);
  return (
    <div className={cn("space-y-3 leading-relaxed", className)}>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>
          <InlineMarkdown>{paragraph}</InlineMarkdown>
        </p>
      ))}
    </div>
  );
}

/** Read-only SQL block with our editor's colours but no editor cost. */
export function CodeBlock({
  code,
  className,
  caption,
}: {
  code: string;
  className?: string;
  caption?: string;
}) {
  return (
    <figure className={cn("min-w-0", className)}>
      <pre className="overflow-x-auto scroll-thin rounded-xl border border-border-base bg-code-bg p-3.5 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
      {caption && (
        <figcaption className="mt-1.5 text-xs text-fg-subtle">
          <InlineMarkdown>{caption}</InlineMarkdown>
        </figcaption>
      )}
    </figure>
  );
}
