import type { Metadata } from "next";
import { SettingsNav } from "@/components/settings/settings-nav";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  description: "Manage your SQLQuest profile, learning preferences and privacy.",
  path: "/settings",
  noIndex: true,
});

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Preferences are stored on this device and synced to your account when
          you&rsquo;re signed in.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
    </div>
  );
}
