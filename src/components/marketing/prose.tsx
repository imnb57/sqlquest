import { cn } from "@/lib/utils";

/**
 * Typographic wrapper for long-form static pages (legal, about, accessibility).
 * Styles descendants directly so the page bodies stay plain semantic HTML.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-none",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:scroll-mt-24",
        "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-extrabold",
        "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-fg-muted",
        "[&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:text-fg-muted [&_ul]:marker:text-brand-500",
        "[&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:text-fg-muted [&_ol]:marker:font-bold [&_ol]:marker:text-brand-500",
        "[&_li]:leading-relaxed",
        "[&_a]:font-bold [&_a]:text-brand-500 [&_a]:underline-offset-4 hover:[&_a]:underline",
        "[&_strong]:font-extrabold [&_strong]:text-fg",
        "[&_code]:rounded [&_code]:bg-code-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:font-semibold",
        "[&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-border-strong [&_th]:py-2 [&_th]:text-left [&_th]:font-extrabold",
        "[&_td]:border-b [&_td]:border-border-base [&_td]:py-2 [&_td]:align-top [&_td]:text-fg-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Standard header for a static page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  updated,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** ISO date shown as "Last updated". */
  updated?: string;
}) {
  return (
    <header className="mb-10">
      {eyebrow && (
        <p className="text-xs font-extrabold tracking-widest text-brand-500 uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      {updated && (
        <p className="mt-4 text-sm text-fg-subtle">
          Last updated{" "}
          <time dateTime={updated}>
            {new Date(updated).toLocaleDateString("en", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
      )}
    </header>
  );
}
