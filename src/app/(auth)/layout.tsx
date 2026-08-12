import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/20 to-aqua-400/15 blur-3xl"
      />

      <header className="relative flex items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/learn"
            className="rounded-xl px-3 py-2 text-sm font-bold text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
          >
            Continue as guest
          </Link>
        </div>
      </header>

      <main id="main" className="relative flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="relative px-4 py-6 text-center text-xs text-fg-subtle">
        By continuing you agree to our{" "}
        <Link href="/terms" className="font-bold hover:text-brand-500">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-bold hover:text-brand-500">
          privacy policy
        </Link>
        .
      </footer>
    </div>
  );
}
