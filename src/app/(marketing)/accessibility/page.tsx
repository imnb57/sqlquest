import type { Metadata } from "next";
import Link from "next/link";

import { Prose, PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Accessibility",
  description:
    "How SQLQuest works with keyboards, screen readers and reduced motion — and what we know still needs improvement.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Accessibility", path: "/accessibility" },
        ])}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Commitment"
          title="Accessibility"
          description="A course nobody can use isn't a course. Here's what's in place, and what we know still needs work."
          updated="2026-06-01"
        />

        <Prose>
          <h2>Standard</h2>
          <p>
            We target <strong>WCAG 2.2 Level AA</strong>. Some of it is
            enforced automatically — colour tokens are checked for contrast, and
            interactive elements are built on Radix primitives that ship correct
            ARIA semantics and focus management.
          </p>

          <h2>Keyboard</h2>
          <ul>
            <li>Every interactive element is reachable and operable by keyboard.</li>
            <li>A visible focus ring is never suppressed.</li>
            <li>&ldquo;Skip to content&rdquo; is the first thing in the tab order.</li>
            <li>
              In lessons: <code>Ctrl/⌘ + Enter</code> checks an answer,{" "}
              <code>Enter</code> advances once feedback is showing.
            </li>
            <li>
              Reorder challenges have explicit up/down buttons — drag and drop is
              never the only way to answer.
            </li>
            <li>Dialogs trap focus and restore it on close.</li>
          </ul>

          <h2>Screen readers</h2>
          <ul>
            <li>Landmarks, headings and lists are used semantically.</li>
            <li>
              Answer feedback is announced through a polite live region rather
              than only being shown visually.
            </li>
            <li>Progress bars expose their value via ARIA.</li>
            <li>
              Charts carry accessible descriptions, and the XP chart offers a
              &ldquo;view as table&rdquo; alternative.
            </li>
            <li>
              Every activity-heatmap cell has an accessible name including the
              exact XP and date.
            </li>
            <li>Icons are decorative and hidden; buttons carry real labels.</li>
          </ul>

          <h2>Motion</h2>
          <p>
            <code>prefers-reduced-motion</code> is respected globally: Lottie
            animations don&rsquo;t load, confetti is suppressed, and transitions
            collapse to near-zero. There&rsquo;s also an in-app{" "}
            <Link href="/settings/appearance">reduce motion</Link> toggle for
            people who want it here but not system-wide.
          </p>

          <h2>Colour and contrast</h2>
          <ul>
            <li>Body text meets 4.5:1; large text and UI elements meet 3:1.</li>
            <li>
              Colour is never the sole carrier of meaning — correct/incorrect
              states pair colour with an icon and text.
            </li>
            <li>
              Light and dark themes are designed separately rather than one
              being an inversion of the other.
            </li>
          </ul>

          <h2>Zoom and reflow</h2>
          <p>
            Layouts reflow to 320px and remain usable at 400% zoom. Text uses
            relative units throughout, so browser font-size settings are honoured.
          </p>

          <h2>Known gaps</h2>
          <p>We&rsquo;d rather list these than pretend they don&rsquo;t exist:</p>
          <ul>
            <li>
              <strong>The code editor.</strong> CodeMirror&rsquo;s screen-reader
              support is good but not perfect for long queries. Multiple-choice,
              fill-blank, reorder and predict challenges are fully accessible
              alternatives, and every concept is taught through more than one
              format.
            </li>
            <li>
              <strong>Result grids.</strong> Very wide result sets scroll
              horizontally; we&rsquo;re working on a responsive card view.
            </li>
            <li>
              <strong>Translations.</strong> English only for now.
            </li>
          </ul>

          <h2>Tell us</h2>
          <p>
            If something blocks you, that&rsquo;s a bug and we want to hear about
            it. Email{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>{" "}
            or open an issue — accessibility reports jump the queue.
          </p>
        </Prose>
      </div>
    </>
  );
}
