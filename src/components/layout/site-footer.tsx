import Link from "next/link";
import { Heart, Rss } from "lucide-react";
import { GithubIcon } from "@/components/brand/icons";

import { LogoMark } from "@/components/brand/logo";
import { footerNav, siteConfig } from "@/lib/site";
import { curriculumStats } from "@/content/curriculum";

/**
 * Site footer.
 *
 * Doubles as an HTML sitemap — every important public URL is one crawl away
 * from every page, which is the cheapest internal-linking win there is.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-base bg-bg-subtle">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,3fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label={`${siteConfig.name} home`}
            >
              <LogoMark />
              <span className="text-xl font-extrabold tracking-tight">
                SQL<span className="text-gradient">Quest</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
              {siteConfig.shortDescription} {curriculumStats.lessons} lessons,{" "}
              {curriculumStats.challenges} challenges, and a real PostgreSQL
              engine that runs entirely in your browser.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noreferrer noopener"
                className="grid size-10 place-items-center rounded-xl border border-border-base text-fg-muted transition-colors hover:border-brand-500 hover:text-brand-500"
                aria-label="GitHub"
              >
                <GithubIcon className="size-4.5" />
              </a>
              <Link
                href="/rss.xml"
                className="grid size-10 place-items-center rounded-xl border border-border-base text-fg-muted transition-colors hover:border-brand-500 hover:text-brand-500"
                aria-label="RSS feed"
              >
                <Rss className="size-4.5" />
              </Link>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="eyebrow text-fg-subtle">
                  {group.title}
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-semibold text-fg-muted transition-colors hover:text-brand-500"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-base pt-6 sm:flex-row">
          <p className="text-xs text-fg-subtle">
            © {year} {siteConfig.name}. Open source under the MIT licence.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            Built with <Heart className="size-3.5 fill-heart text-heart" /> and
            an unreasonable amount of SQL.
          </p>
        </div>
      </div>
    </footer>
  );
}
