import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { PwaRegister } from "@/components/providers/pwa-register";
import { SquircleFilters } from "@/components/ui/squircle-filter";
import "./globals.css";

export const metadata: Metadata = {
  title: "UGC | Faceless Content on Autopilot",
  description:
    "Pick your content style and channel theme once. UGC writes, voices, renders, and posts faceless videos while you sleep, with advanced metrics on what works.",
  metadataBase: new URL("https://tryscalar.xyz"),
  applicationName: "UGC",
  appleWebApp: {
    capable: true,
    title: "UGC",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "UGC | Faceless Content on Autopilot",
    description:
      "Faceless short-form videos written, rendered, and auto-posted to TikTok, Reels, and Shorts while you sleep.",
    url: "https://tryscalar.xyz",
    siteName: "UGC",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const page = (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <SquircleFilters />
        <AppProviders>{children}</AppProviders>
        <PwaRegister />
      </body>
    </html>
  );
  // Without a Convex deployment the marketing and legal pages still render;
  // only the signed-in pages need it.
  return process.env.NEXT_PUBLIC_CONVEX_URL ? (
    <ConvexAuthNextjsServerProvider>{page}</ConvexAuthNextjsServerProvider>
  ) : (
    page
  );
}
