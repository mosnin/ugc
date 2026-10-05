import type { NextFetchEvent, NextRequest } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAuthPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isProtected = createRouteMatcher(["/dashboard(.*)"]);

const convexAuthProxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const signedIn = await convexAuth.isAuthenticated();
  if (isAuthPage(request) && signedIn) return nextjsMiddlewareRedirect(request, "/dashboard");
  if (isProtected(request) && !signedIn) return nextjsMiddlewareRedirect(request, "/sign-in");
});

// Next 16 calls this file "proxy" (formerly middleware). Convex Auth also
// serves its token-refresh endpoint (/api/auth) from here. Without a Convex
// deployment configured, public pages pass through and protected ones go to
// the home page.
export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return isProtected(request) || isAuthPage(request) ? nextjsMiddlewareRedirect(request, "/") : undefined;
  }
  return convexAuthProxy(request, event);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
