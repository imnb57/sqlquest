import { cn } from "@/lib/utils";

/**
 * Brand marks.
 *
 * lucide-react v1 dropped third-party logos, so the handful we need are
 * inlined here — smaller than pulling in a whole brand-icon package for two
 * glyphs, and they inherit `currentColor` like every other icon.
 */

type IconProps = React.SVGProps<SVGSVGElement>;

export function GithubIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

export function DiscordIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.3.5c1.6.4 2.9 1 4.2 1.8a14 14 0 0 0-12.6 0A16.7 16.7 0 0 1 11 3.5L10.6 3C8.9 3.3 7.2 3.8 5.7 4.4 2.6 9 1.8 13.5 2.2 18a20 20 0 0 0 6 3l1.3-2c-.7-.3-1.4-.6-2-1l.5-.4a14.3 14.3 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.9 19.9 0 0 0 6-3c.5-5.2-.8-9.7-3.5-13.6ZM8.9 15.3c-1.2 0-2.1-1.1-2.1-2.4 0-1.3.9-2.4 2.1-2.4s2.2 1.1 2.2 2.4c0 1.3-1 2.4-2.2 2.4Zm6.2 0c-1.2 0-2.1-1.1-2.1-2.4 0-1.3.9-2.4 2.1-2.4s2.2 1.1 2.2 2.4c0 1.3-1 2.4-2.2 2.4Z" />
    </svg>
  );
}
