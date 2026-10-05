"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Email + password sign in / sign up through Convex Auth, plus Google. */
export function AuthForm({ flow }: { flow: "signIn" | "signUp" }) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    form.set("flow", flow);
    try {
      await signIn("password", form);
      router.push("/dashboard");
    } catch {
      setError(
        flow === "signIn"
          ? "That email and password did not match."
          : "Could not create the account. The email may already be in use, and passwords need 8+ characters.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">
        {flow === "signIn" ? "Sign in" : "Create your account"}
      </h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {flow === "signIn" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        onClick={() => void signIn("google", { redirectTo: "/dashboard" })}
      >
        Continue with Google
      </Button>
      <p className="mt-6 text-sm text-muted-foreground">
        {flow === "signIn" ? (
          <>
            New here? <Link href="/sign-up" className="underline">Create an account</Link>
          </>
        ) : (
          <>
            Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
          </>
        )}
      </p>
    </div>
  );
}
