"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertTriangle, Loader2, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form-controls";
import { GithubIcon } from "@/components/brand/icons";
import { useProgressStore } from "@/stores/progress-store";

/**
 * Sign-in / sign-up form.
 *
 * Both modes share this component because the only differences are two extra
 * fields and which endpoint gets called first. The guest-progress notice is
 * important: people arrive here having already earned XP, and need telling
 * that it carries over.
 */
export function AuthForm({
  mode,
  oauth,
}: {
  mode: "login" | "register";
  /** Which OAuth providers the deployment has configured. */
  oauth: { github: boolean; google: boolean };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const xp = useProgressStore((s) => s.xp);
  const hasHydrated = useProgressStore((s) => s.hasHydrated);

  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    params.get("error") ? "Sign-in failed. Please check your details." : null,
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const isRegister = mode === "register";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      if (isRegister) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: String(data.get("name") ?? ""),
            username: String(data.get("username") ?? "").toLowerCase(),
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
            fieldErrors?: Record<string, string[]>;
          };
          setFieldErrors(body.fieldErrors ?? {});
          throw new Error(body.message ?? "Could not create your account.");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) throw new Error("That email and password don't match.");
      router.push(callbackUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-7 shadow-xl shadow-brand-950/5">
      <h1 className="text-2xl font-extrabold">
        {isRegister ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        {isRegister
          ? "Free forever. No card, no upsell."
          : "Sign in to sync your progress across devices."}
      </p>

      {hasHydrated && xp > 0 && (
        <p className="mt-4 rounded-xl border border-lime-accent-500/40 bg-lime-accent-400/10 p-3 text-sm font-semibold">
          🎉 Your {xp} XP from this browser will be saved to the account
          automatically.
        </p>
      )}

      {(oauth.github || oauth.google) && (
        <>
          <div className="mt-6 grid gap-2.5">
            {oauth.github && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                full
                onClick={() => void signIn("github", { callbackUrl })}
              >
                <GithubIcon />
                Continue with GitHub
              </Button>
            )}
            {oauth.google && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                full
                onClick={() => void signIn("google", { callbackUrl })}
              >
                <Mail />
                Continue with Google
              </Button>
            )}
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-base" />
            <span className="text-xs font-bold text-fg-subtle uppercase">or</span>
            <span className="h-px flex-1 bg-border-base" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className={cn(!oauth.github && !oauth.google && "mt-6")}>
        <div className="space-y-4">
          {isRegister && (
            <>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={60}
                  className="mt-1.5"
                  placeholder="Ada Lovelace"
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                <FieldError errors={fieldErrors.name} />
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9_]+"
                  className="mt-1.5 font-mono"
                  placeholder="ada_l"
                  aria-invalid={Boolean(fieldErrors.username)}
                />
                <FieldError errors={fieldErrors.username} />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1.5"
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            <FieldError errors={fieldErrors.email} />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={8}
              className="mt-1.5"
              placeholder={isRegister ? "At least 8 characters" : "••••••••"}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            <FieldError errors={fieldErrors.password} />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/8 p-3 text-sm font-semibold text-danger"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <Button type="submit" size="lg" full uppercase className="mt-6" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-fg-muted">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand-500 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="font-bold text-brand-500 hover:underline">
              Create a free account
            </Link>
          </>
        )}
      </p>

      <p className="mt-3 text-center text-xs text-fg-subtle">
        You don&rsquo;t need an account to learn —{" "}
        <Link href="/learn" className="font-bold hover:text-brand-500">
          jump straight in
        </Link>
        .
      </p>
    </Card>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1 text-xs font-semibold text-danger">{errors[0]}</p>
  );
}
