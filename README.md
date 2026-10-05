# UGC

Faceless short-form channels on autopilot. Pick a content style and a channel
theme once; UGC writes, renders, stores and posts videos to TikTok, Reels,
Shorts and Facebook on a schedule, then tracks how each one performs.

Next.js 16 · React 19 · TypeScript · Tailwind v4 · **Convex** (database,
functions, scheduling) · **Convex Auth** · **Cloudflare R2** storage. Providers:
OpenAI (scripts), MuAPI (text-to-video), Ayrshare (posting + analytics), Stripe
(credit packs).

## Local setup

```bash
pnpm install
npx convex dev        # creates or links a Convex deployment and writes .env.local
pnpm dev              # http://localhost:3000
```

Then set the deployment's environment variables (auth keys, R2, provider keys)
with `npx convex env set`. Every variable is listed and explained in
`.env.local.example`.

## Checks

```bash
pnpm test             # vitest + convex-test (convex/*.test.ts)
pnpm typecheck
pnpm lint
pnpm build
```

## Where things live

- `convex/` - the whole backend; see `docs/engineering/backend.md`
- `src/app/` - pages: marketing home, legal, `/sign-in`, `/sign-up`, `/dashboard`
- `src/components/landingpage/` - the marketing site (Cardinal template)
- `vendor/` - imported upstream projects used as references (`vendor/README.md`)
- `docs/` - product, decisions and engineering notes (`docs/README.md`)
