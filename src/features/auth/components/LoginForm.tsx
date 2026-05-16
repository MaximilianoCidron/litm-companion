"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { signInWithGoogle, signInWithPassword } from "../lib/client-auth";
import { loginSchema } from "../schemas/login";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    startTransition(async () => {
      try {
        await signInWithPassword(parsed.data.email, parsed.data.password);
        router.replace("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed.");
      }
    });
  };

  const onGoogle = () => {
    setError(null);
    startTransition(async () => {
      try {
        await signInWithGoogle();
        router.replace("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-mist-light bg-parchment-elevated p-6 dark:border-mist-dark dark:bg-ink-elevated"
      noValidate
    >
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink-muted dark:text-parchment-muted">
          Email
        </span>
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          state={error ? "error" : "default"}
          aria-invalid={error ? true : undefined}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink-muted dark:text-parchment-muted">
          Password
        </span>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          state={error ? "error" : "default"}
          aria-invalid={error ? true : undefined}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-crimson dark:text-crimson-dark">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
        <span className="h-px flex-1 bg-mist-light dark:bg-mist-dark" />
        or
        <span className="h-px flex-1 bg-mist-light dark:bg-mist-dark" />
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={pending}
        onClick={onGoogle}
      >
        Continue with Google
      </Button>
    </form>
  );
}
