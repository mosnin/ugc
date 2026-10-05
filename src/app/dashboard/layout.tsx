import type { ReactNode } from "react";

// Auth state is per request, so these pages are never prerendered.
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
