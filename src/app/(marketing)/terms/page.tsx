import type { Metadata } from "next";
import Link from "next/link";

import { Prose, PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const UPDATED = "2026-06-01";

export const metadata: Metadata = buildMetadata({
  title: "Terms of service",
  description:
    "The terms under which SQLQuest is provided — free, open source, as-is, with no account required.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms of service", path: "/terms" },
        ])}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Legal"
          title="Terms of service"
          description="Plain language, because there's very little to agree to: the service is free, the code is open, and you own what you write."
          updated={UPDATED}
        />

        <Prose>
          <h2>1. Agreement</h2>
          <p>
            By using {siteConfig.name} you agree to these terms. If you
            don&rsquo;t, please don&rsquo;t use it — and note that the source is
            MIT-licensed, so you&rsquo;re free to run your own copy under
            whatever terms you like.
          </p>

          <h2>2. The service</h2>
          <p>
            {siteConfig.name} is a free, interactive SQL course. It runs a
            PostgreSQL engine compiled to WebAssembly inside your browser.
            Accounts are optional and add only progress sync, a public profile
            and the leaderboard.
          </p>

          <h2>3. Accounts</h2>
          <ul>
            <li>You must provide an accurate email address.</li>
            <li>You&rsquo;re responsible for keeping your password secure.</li>
            <li>One person per account; don&rsquo;t share credentials.</li>
            <li>
              We may suspend accounts used for abuse, spam, or attempts to
              disrupt the service for others.
            </li>
          </ul>

          <h2>4. Acceptable use</h2>
          <p>Please don&rsquo;t:</p>
          <ul>
            <li>Attempt to break, overload or gain unauthorised access to the service</li>
            <li>Scrape at a volume that degrades it for other people</li>
            <li>Upload unlawful content, or anything designed to harm others</li>
            <li>Impersonate someone else in your profile</li>
          </ul>

          <h2>5. Your content</h2>
          <p>
            The SQL you write is yours. Because it&rsquo;s executed on your own
            device and never transmitted, we couldn&rsquo;t claim rights over it
            even if we wanted to. Anything you post publicly — a username, a
            bio, a shared snippet — you grant us a licence to display for the
            purpose of running the service.
          </p>

          <h2>6. Our content</h2>
          <p>
            The application source is MIT-licensed. Lesson text, datasets and
            articles are published under{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer noopener"
            >
              CC BY-SA 4.0
            </a>
            . Use them in a class, a blog post or your own project — just credit
            the source and share alike.
          </p>

          <h2>7. Availability</h2>
          <p>
            The service is provided <strong>as is</strong>, with no uptime
            guarantee. It&rsquo;s a free, community-maintained project. We may
            change, suspend or discontinue any part of it. If that ever happens,
            your data remains exportable — and since the code is open, the
            project can outlive us.
          </p>

          <h2>8. No warranty</h2>
          <p>
            {siteConfig.name} is educational material, not professional advice.
            We make no warranty that it is error-free or fit for a particular
            purpose. Don&rsquo;t run a lesson&rsquo;s example against production
            data.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, we are not liable for any
            indirect or consequential loss arising from your use of the service.
            Nothing here limits liability that cannot lawfully be limited.
          </p>

          <h2>10. Privacy</h2>
          <p>
            Covered separately in the <Link href="/privacy">privacy policy</Link>,
            which forms part of these terms.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update these terms; the date at the top will change and the
            full history is visible in the public repository. Continuing to use
            the service after a change means you accept it.
          </p>

          <h2>12. Contact</h2>
          <p>
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
          </p>
        </Prose>
      </div>
    </>
  );
}
