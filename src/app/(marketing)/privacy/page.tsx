import type { Metadata } from "next";
import Link from "next/link";

import { Prose, PageHeader } from "@/components/marketing/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const UPDATED = "2026-06-01";

export const metadata: Metadata = buildMetadata({
  title: "Privacy policy",
  description:
    "What SQLQuest stores, where it's stored, and what we never collect. Your SQL never leaves your browser.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy policy", path: "/privacy" },
        ])}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Legal"
          title="Privacy policy"
          description="The short version: your SQL never leaves your browser, progress is stored locally by default, and we don't sell anything to anyone."
          updated={UPDATED}
        />

        <Prose>
          <h2>1. The short version</h2>
          <ul>
            <li>
              <strong>Your queries never leave your device.</strong> The SQL
              engine is PostgreSQL compiled to WebAssembly, running inside your
              browser tab. There is no server that could receive what you type.
            </li>
            <li>
              <strong>You can use the whole product anonymously.</strong> No
              account is needed for any lesson.
            </li>
            <li>
              <strong>We don&rsquo;t sell data</strong>, run advertising, or
              embed third-party trackers.
            </li>
          </ul>

          <h2>2. What&rsquo;s stored in your browser</h2>
          <p>
            Whether or not you have an account, the following is kept in your
            browser&rsquo;s local storage:
          </p>
          <ul>
            <li>Progress: XP, level, streak, per-lesson and per-challenge records</li>
            <li>Preferences: theme, sound, motion, editor and privacy settings</li>
            <li>Playground state: your current buffer and recent query history</li>
          </ul>
          <p>
            None of this is transmitted anywhere unless you sign in. Clearing
            your browser data deletes it. You can export it all as JSON from{" "}
            <Link href="/settings/data">Settings → Data</Link>.
          </p>

          <h2>3. What&rsquo;s stored on our servers</h2>
          <p>
            Only if you choose to create an account, and only these fields:
          </p>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Email address</td>
                <td>Sign-in and account recovery</td>
              </tr>
              <tr>
                <td>Display name, username, optional bio and country</td>
                <td>Your public profile and the leaderboard</td>
              </tr>
              <tr>
                <td>Password hash (bcrypt)</td>
                <td>Sign-in. We never store the password itself.</td>
              </tr>
              <tr>
                <td>Progress snapshot</td>
                <td>So your XP and streak survive a new device</td>
              </tr>
              <tr>
                <td>Daily activity totals</td>
                <td>Streak calendar and leaderboard</td>
              </tr>
            </tbody>
          </table>
          <p>
            We do <strong>not</strong> store the SQL you write. Submissions are
            graded on your device; only whether a challenge was solved is ever
            recorded.
          </p>

          <h2>4. Cookies</h2>
          <p>
            Signed out, we set no cookies at all. Signed in, we set one
            essential session cookie so you stay logged in. There are no
            advertising or cross-site tracking cookies — see the{" "}
            <Link href="/cookies">cookie policy</Link>.
          </p>

          <h2>5. Analytics</h2>
          <p>
            A deployment may optionally enable a self-hosted, cookie-free
            analytics tool (Plausible or Umami) that records page views without
            personal identifiers or fingerprinting. It is disabled by default,
            and you can turn off aggregate usage sharing in{" "}
            <Link href="/settings/privacy">privacy settings</Link>.
          </p>

          <h2>6. Third parties</h2>
          <p>
            If you sign in with GitHub or Google, that provider tells us your
            email, name and avatar URL. We share nothing back. No other third
            party receives your data. The application loads no external scripts,
            fonts or images — a strict Content Security Policy enforces this.
          </p>

          <h2>7. Your rights</h2>
          <ul>
            <li>
              <strong>Access and portability</strong> — export everything as
              JSON at any time, no request needed.
            </li>
            <li>
              <strong>Correction</strong> — edit your profile in settings.
            </li>
            <li>
              <strong>Erasure</strong> — delete your account from settings;
              deletion cascades to every row that references it.
            </li>
            <li>
              <strong>Objection</strong> — opt out of the leaderboard, public
              profile and analytics individually.
            </li>
          </ul>
          <p>
            If you&rsquo;re in the EEA or UK, the lawful bases we rely on are
            contract (running the account you asked for) and legitimate
            interests (keeping the service working and secure).
          </p>

          <h2>8. Retention</h2>
          <p>
            Account data is kept until you delete the account. Local browser
            data is kept until you clear it. Activity records older than about
            13 months are trimmed automatically.
          </p>

          <h2>9. Children</h2>
          <p>
            SQLQuest is suitable for all ages, but accounts are not intended for
            children under 13. You can use every lesson without an account, so
            younger learners need never provide any personal data.
          </p>

          <h2>10. Changes</h2>
          <p>
            Material changes will be noted on this page with a new date. The
            full history is in the public Git repository, so you can see exactly
            what changed and when.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about any of this:{" "}
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
            .
          </p>
        </Prose>
      </div>
    </>
  );
}
