"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";

/**
 * Placeholder signed-in page that proves auth and the Convex wiring. The real
 * dashboard (modelled on Open-AI-UGC) is the next cycle.
 */
export default function DashboardPage() {
  const me = useQuery(api.users.me);
  const channels = useQuery(api.channels.list);
  const { signOut } = useAuthActions();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
      {me === undefined ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : me === null ? (
        <p className="mt-8 text-muted-foreground">Not signed in.</p>
      ) : (
        <div className="mt-8 space-y-6">
          <p>
            Signed in as <strong>{me.email ?? me.name ?? me._id}</strong> with{" "}
            <strong>{me.credits.toLocaleString()}</strong> credits.
          </p>
          <section>
            <h2 className="text-lg font-medium">Channels</h2>
            {channels?.length ? (
              <ul className="mt-3 space-y-2">
                {channels.map((c) => (
                  <li key={c._id} className="rounded-lg border border-border p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.theme} · {c.postTimes.join(", ")} {c.timezone} · autopilot{" "}
                      {c.autopilot ? "on" : "off"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No channels yet.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
