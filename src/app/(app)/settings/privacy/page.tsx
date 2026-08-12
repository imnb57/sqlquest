"use client";

import Link from "next/link";

import {
  SettingsSection,
  SettingsRow,
  SwitchRow,
} from "@/components/settings/settings-primitives";
import { useSettingsStore } from "@/stores/settings-store";

export default function PrivacySettingsPage() {
  const s = useSettingsStore();

  return (
    <>
      <SettingsSection
        title="Visibility"
        description="Control what other people can see."
      >
        <SwitchRow
          id="public-profile"
          label="Public profile"
          description="Lets anyone with the link view your level, streak and completed tracks. Turning this off makes the page 404 for everyone but you."
          checked={s.publicProfile}
          onCheckedChange={(v) => s.set("publicProfile", v)}
        />
        <SwitchRow
          id="leaderboard"
          label="Appear on the leaderboard"
          description="Show your name and weekly XP in the rankings."
          checked={s.showOnLeaderboard}
          onCheckedChange={(v) => s.set("showOnLeaderboard", v)}
        />
      </SettingsSection>

      <SettingsSection title="Analytics">
        <SwitchRow
          id="anonymous-stats"
          label="Share anonymous usage stats"
          description="Aggregate, non-identifying counts — which lessons people find hardest, where they drop off. It's what tells us which explanations need rewriting."
          checked={s.shareAnonymousStats}
          onCheckedChange={(v) => s.set("shareAnonymousStats", v)}
        />
      </SettingsSection>

      <SettingsSection title="What stays on your device">
        <SettingsRow
          label="Your SQL never leaves the browser"
          description="Every query you write runs against a PostgreSQL engine compiled to WebAssembly inside this tab. Submissions are graded locally — there is no server that could see them."
        />
        <SettingsRow
          label="Progress is local-first"
          description="XP, streaks and lesson records live in this browser's storage. If you're signed in, a copy is backed up to your account so you can pick up on another device."
        />
        <SettingsRow
          label="Read the details"
          description="The privacy policy spells out exactly what's stored, where, and for how long."
          control={
            <Link
              href="/privacy"
              className="text-sm font-bold text-brand-500 hover:underline"
            >
              Privacy policy →
            </Link>
          }
        />
      </SettingsSection>
    </>
  );
}
