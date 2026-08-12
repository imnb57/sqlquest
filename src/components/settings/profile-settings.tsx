"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogIn, Save } from "lucide-react";
import { toast } from "sonner";

import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/overlays";
import { Input, Textarea, Label } from "@/components/ui/form-controls";
import { SettingsSection, SettingsRow } from "./settings-primitives";
import { useLevel, useProgressStore } from "@/stores/progress-store";

export function ProfileSettings() {
  const { data: session, status } = useSession();
  const level = useLevel();
  const xp = useProgressStore((s) => s.xp);

  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Seed the form from the session once it arrives. Adjusting state during
  // render on a detected change is React's alternative to an effect here, and
  // it means the inputs are never briefly empty after sign-in resolves.
  const sessionUserId = session?.user?.id ?? null;
  const [seededFor, setSeededFor] = React.useState<string | null>(null);
  if (sessionUserId && seededFor !== sessionUserId) {
    setSeededFor(sessionUserId);
    setName(session?.user?.name ?? "");
    setUsername(session?.user?.username ?? "");
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, username, bio }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Could not save your profile.");
      }
      toast.success("Profile saved");
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <SettingsSection
        title="Profile"
        description="A public profile needs an account."
      >
        <div className="px-5 py-8 text-center">
          <Avatar className="mx-auto size-16">
            <AvatarFallback className="from-slate-400 to-slate-600 text-lg">
              ?
            </AvatarFallback>
          </Avatar>
          <p className="mt-4 font-bold">You&rsquo;re learning as a guest</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
            All {xp} XP and your level {level.level} progress are saved in this
            browser. Create a free account to back it up, sync across devices
            and appear on the leaderboard.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button asChild>
              <Link href="/register">
                <LogIn />
                Create free account
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <form onSubmit={onSave}>
      <SettingsSection
        title="Public profile"
        description="How you appear on the leaderboard and your profile page."
      >
        <SettingsRow
          label="Avatar"
          description="Pulled from your sign-in provider."
          control={
            <Avatar className="size-14">
              {session.user.image && <AvatarImage src={session.user.image} alt="" />}
              <AvatarFallback className="text-base">
                {initials(session.user.name ?? username)}
              </AvatarFallback>
            </Avatar>
          }
        />

        <div className="space-y-4 px-5 py-4">
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="mt-1.5"
              placeholder="Ada Lovelace"
            />
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={24}
              pattern="[a-z0-9_]+"
              className="mt-1.5 font-mono"
              placeholder="ada_l"
            />
            <p className="mt-1 text-xs text-fg-subtle">
              Your profile lives at /profile/{username || "username"} — letters,
              numbers and underscores only.
            </p>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              className="mt-1.5"
              placeholder="Data engineer, reluctant DBA, enthusiastic about window functions."
            />
            <p className="mt-1 text-xs text-fg-subtle tabular-nums">
              {bio.length}/280
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <Badge variant="default">
            {level.rank.glyph} {level.rank.title} · Level {level.level}
          </Badge>
          <Button type="submit" disabled={saving}>
            <Save />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Account"
        description="Sign-in details."
        className="mt-5"
      >
        <SettingsRow
          label="Email"
          description={session.user.email ?? "Not set"}
          control={<Badge variant="neutral">Verified</Badge>}
        />
      </SettingsSection>
    </form>
  );
}
