import type { NextConfig } from "next";

// The Convex deployment this build talks to (HTTP for queries/mutations,
// WebSocket for live sync). Cloud deployments live on *.convex.cloud; a local
// `npx convex dev` backend is whatever NEXT_PUBLIC_CONVEX_URL points at.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexOrigins = convexUrl
  ? [new URL(convexUrl).origin, new URL(convexUrl).origin.replace(/^http/, "ws")]
  : [];

const cspHeader = [
  "default-src 'self'",
  // unsafe-eval is required by Next.js 16 (hot module replacement in dev; some
  // bundler output in prod). unsafe-inline is required by styled-jsx. A
  // nonce-based policy would remove both but needs proxy-level nonce
  // injection - tracked as a future hardening task.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "worker-src 'self' blob:",
  // Google Fonts (loaded via globals.css @import).
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  // Videos play from signed Cloudflare R2 URLs (or a custom R2 domain).
  "media-src 'self' blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  // Convex (API + live sync) and direct uploads to R2 via signed URLs.
  [
    "connect-src 'self'",
    "https://*.convex.cloud wss://*.convex.cloud",
    ...convexOrigins,
    "https://*.r2.cloudflarestorage.com",
  ].join(" "),
  "frame-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Modern guidance is to disable the legacy XSS auditor (it could
          // introduce vulnerabilities); rely on CSP instead.
          { key: "X-XSS-Protection", value: "0" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
