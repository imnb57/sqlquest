import type { Metadata } from "next";
import Link from "next/link";

import { Prose, PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

const UPDATED = "2026-06-01";

export const metadata: Metadata = buildMetadata({
  title: "Cookie policy",
  description:
    "SQLQuest sets no cookies at all when you're signed out, and one essential session cookie when you're signed in. No tracking, no consent banner needed.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Cookie policy", path: "/cookies" },
        ])}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Legal"
          title="Cookie policy"
          description="There is no cookie banner on this site, because there is nothing to consent to."
          updated={UPDATED}
        />

        <Prose>
          <h2>Signed out: zero cookies</h2>
          <p>
            Browse the whole site, take every lesson, use the playground — no
            cookies are set. Your progress lives in <code>localStorage</code>,
            which is technically different: it&rsquo;s never transmitted to a
            server, so it doesn&rsquo;t require consent under the ePrivacy
            Directive.
          </p>

          <h2>Signed in: one essential cookie</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Lifetime</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>authjs.session-token</code>
                </td>
                <td>
                  Keeps you signed in. Strictly necessary — without it, the
                  account you asked for cannot function.
                </td>
                <td>30 days</td>
              </tr>
              <tr>
                <td>
                  <code>authjs.csrf-token</code>
                </td>
                <td>
                  Protects sign-in forms against cross-site request forgery.
                  Strictly necessary.
                </td>
                <td>Session</td>
              </tr>
            </tbody>
          </table>
          <p>
            Both are <code>httpOnly</code>, <code>secure</code> and{" "}
            <code>sameSite=lax</code>. Neither is used for tracking or profiling.
          </p>

          <h2>Local storage</h2>
          <p>
            We store these keys in your browser. Clearing site data removes
            them, and you can export the contents first from{" "}
            <Link href="/settings/data">Settings → Data</Link>.
          </p>
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Contents</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>sqlquest:progress</code>
                </td>
                <td>XP, level, streak, lesson and challenge records</td>
              </tr>
              <tr>
                <td>
                  <code>sqlquest:settings</code>
                </td>
                <td>Theme, sound, motion, editor and privacy preferences</td>
              </tr>
              <tr>
                <td>
                  <code>sqlquest:playground</code>
                </td>
                <td>Your current playground query and recent history</td>
              </tr>
              <tr>
                <td>
                  <code>sqlquest:theme</code>
                </td>
                <td>Light / dark / system preference</td>
              </tr>
            </tbody>
          </table>

          <h2>No third-party cookies</h2>
          <p>
            A strict Content Security Policy blocks requests to every external
            host, so no advertising network, social widget or CDN can set a
            cookie here even in principle.
          </p>

          <h2>Analytics</h2>
          <p>
            If an operator enables the optional analytics integration, it is a
            self-hosted, cookie-free tool that counts page views without
            identifying individuals. See the{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>
        </Prose>
      </div>
    </>
  );
}
