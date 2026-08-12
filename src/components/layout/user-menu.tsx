"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOutAndClear } from "@/lib/auth/sign-out";
import { CloudOff, LogIn, LogOut, Settings, User as UserIcon } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/overlays";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { useProgressStore } from "@/stores/progress-store";

/**
 * Account menu.
 *
 * Signed-out learners are first-class: progress is already being saved
 * locally, so the menu offers to *back it up* rather than gating anything.
 */
export function UserMenu({ compact }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const xp = useProgressStore((s) => s.xp);
  const user = session?.user;

  if (status === "loading") {
    return <div className={cn("size-10 rounded-full bg-bg-inset shimmer")} />;
  }

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-bold text-fg-muted transition-colors hover:bg-bg-inset hover:text-fg",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Account menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="from-slate-400 to-slate-600">
              <UserIcon className="size-4" />
            </AvatarFallback>
          </Avatar>
          {!compact && <span>Guest</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={compact ? "end" : "start"}>
          <DropdownMenuLabel>Playing as guest</DropdownMenuLabel>
          <div className="px-3 pb-2 text-xs leading-relaxed text-fg-muted">
            Your {xp > 0 ? `${xp} XP and ` : ""}progress is saved in this browser.
            Create a free account to keep it across devices.
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/register">
              <LogIn />
              Create free account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/login">
              <UserIcon />
              Sign in
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const handle = user.username ?? user.email?.split("@")[0] ?? "me";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-bg-inset",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{initials(user.name ?? handle)}</AvatarFallback>
        </Avatar>
        {!compact && (
          <span className="max-w-28 truncate text-sm font-bold">
            {user.name ?? handle}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={compact ? "end" : "start"}>
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${handle}`}>
            <UserIcon />
            Public profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="danger"
          onSelect={() => void signOutAndClear()}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Banner shown when progress can't be synced because there's no account. */
export function LocalOnlyNotice({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  if (status === "loading" || session?.user) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border-base bg-bg-subtle p-4",
        className,
      )}
    >
      <CloudOff className="mt-0.5 size-5 shrink-0 text-fg-subtle" />
      <p className="text-sm leading-relaxed text-fg-muted">
        You&rsquo;re learning as a guest — everything is saved in this browser
        only.{" "}
        <Link href="/register" className="font-bold text-brand-500 hover:underline">
          Create a free account
        </Link>{" "}
        to back it up and appear on the leaderboard.
      </p>
    </div>
  );
}
