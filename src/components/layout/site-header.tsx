"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { GithubIcon } from "@/components/brand/icons";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { marketingNav, siteConfig } from "@/lib/site";

/** Public site header. Collapses to a slide-down sheet under `lg`. */
export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  const [open, setOpen] = React.useState(false);

  // Close the sheet when the route changes. Adjusting state during render on
  // a detected prop change is React's documented alternative to an effect —
  // it avoids the extra render pass an effect would cost on every navigation.
  const [renderedPath, setRenderedPath] = React.useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  // Lock body scroll while the mobile sheet is open.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const signedIn = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 border-b border-border-base bg-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {marketingNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
                      active
                        ? "text-brand-600 dark:text-brand-300"
                        : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="SQLQuest on GitHub"
            className="hidden size-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-inset hover:text-fg sm:grid"
          >
            <GithubIcon className="size-5" />
          </a>

          <ThemeToggle />

          {signedIn ? (
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/learn">Continue learning</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/learn">Start free</Link>
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-inset hover:text-fg lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="animate-slide-up border-t border-border-base bg-bg px-4 py-4 lg:hidden"
        >
          <nav aria-label="Primary mobile">
            <ul className="space-y-1">
              {marketingNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-3 py-3 text-base font-bold text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-border-base pt-4">
            <Button full size="lg" asChild>
              <Link href="/learn">{signedIn ? "Continue learning" : "Start free"}</Link>
            </Button>
            {!signedIn && (
              <Button variant="outline" full size="lg" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
