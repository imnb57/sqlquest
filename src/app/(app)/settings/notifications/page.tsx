"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

import {
  SettingsSection,
  SettingsRow,
  SwitchRow,
} from "@/components/settings/settings-primitives";
import { useSettingsStore } from "@/stores/settings-store";

export default function NotificationSettingsPage() {
  const s = useSettingsStore();
  const { status } = useSession();
  const signedOut = status !== "authenticated";

  return (
    <>
      {signedOut && (
        <div className="rounded-xl border border-border-base bg-bg-subtle p-4 text-sm text-fg-muted">
          Email notifications need an account.{" "}
          <Link href="/register" className="font-bold text-brand-500 hover:underline">
            Create one for free
          </Link>{" "}
          — your progress carries over.
        </div>
      )}

      <SettingsSection
        title="Email"
        description="We only send what you ask for, and every message has a one-click unsubscribe."
      >
        <SwitchRow
          id="streak-reminders"
          label="Streak reminders"
          description="A nudge if your streak is about to lapse. At most one a day."
          checked={s.emailStreakReminders}
          onCheckedChange={(v) => s.set("emailStreakReminders", v)}
          disabled={signedOut}
        />
        <SwitchRow
          id="weekly-digest"
          label="Weekly digest"
          description="Your XP, streak and league standing, every Monday."
          checked={s.emailWeeklyDigest}
          onCheckedChange={(v) => s.set("emailWeeklyDigest", v)}
          disabled={signedOut}
        />
        <SwitchRow
          id="product-updates"
          label="Product updates"
          description="New tracks and features. Rare — a handful a year."
          checked={s.emailProductUpdates}
          onCheckedChange={(v) => s.set("emailProductUpdates", v)}
          disabled={signedOut}
        />
      </SettingsSection>

      <SettingsSection title="What we never do">
        <SettingsRow
          label="No marketing without consent"
          description="Turning everything off here means we will only email you about account security — password resets and the like."
        />
        <SettingsRow
          label="No third-party sharing"
          description="Your email address is never sold, rented or shared with advertisers. See the privacy policy for the full picture."
        />
      </SettingsSection>
    </>
  );
}
