"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Null when no Convex deployment is configured (run `npx convex dev`): the
// marketing site still works, the signed-in pages need the deployment.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {convex ? <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider> : children}
    </NextThemesProvider>
  );
}
