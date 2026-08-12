"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Code2,
  GraduationCap,
  Palette,
  ShieldCheck,
  TriangleAlert,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/settings", label: "Profile", icon: User, exact: true },
  { href: "/settings/learning", label: "Learning", icon: GraduationCap },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/editor", label: "Editor", icon: Code2 },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/privacy", label: "Privacy", icon: ShieldCheck },
  { href: "/settings/data", label: "Data", icon: TriangleAlert },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections">
      <ul className="flex gap-1 overflow-x-auto scroll-thin pb-2 md:flex-col md:overflow-visible md:pb-0">
        {ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? pathname === href : pathname.startsWith(href);

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold whitespace-nowrap transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-brand-500/12 text-brand-600 dark:text-brand-300"
                    : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
