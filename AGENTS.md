# AGENTS.md - working rules for this repo

## Money and posting - never double-charge, never double-post (hard rule)

Credits move only inside mutations that also advance the record they pay for
(`convex/lib/credits.ts`), and every failure path refunds what it charged.
Pipeline and publishing steps check the current status before acting, so a
retried action, a duplicate webhook or the cron safety net is a no-op. Keep
that bar for every new step. Webhooks must authenticate (per-job token or
signature) before touching data.

## Copy - never use em dashes (hard rule)

The application must NEVER use em dashes (the long dash) or en dashes anywhere:
not in UI copy, code, comments, docs, commit messages, or model-generated text.
Use a comma, period, colon, parentheses, or a plain ASCII hyphen (-) instead.
This is non-negotiable. When writing any prose, reach for a hyphen, never the
long dash.

## Icons - keep it tasteful

Do NOT use the "icon inside a tinted rounded box/circle" badge pattern (e.g. a
`bg-primary/10` rounded square wrapping a single lucide icon). It looks generic
and "vibe-coded." Use clean typography and layout instead; use icons sparingly
and only as functional affordances inside buttons, nav/dock items, and compact
list rows - never as decorative chips above headings or beside stats.

## Design system

`DESIGN.md` is the Scalar-era design spec and is being replaced: the product UI
is modelled on the Open-AI-UGC dashboard (`vendor/open-ai-ugc`), and the
marketing site is the Cardinal template (`src/components/landingpage`), kept
exactly as provided. When the dashboard cycle sets the new tokens, rewrite
`DESIGN.md` in the same change.

## This is NOT a vanilla Next.js app (Next 16, App Router)

Don't assume Next ≤14 APIs - verify against the installed version. In particular:
middleware is `src/proxy.ts` (not `middleware.ts`); dynamic route `params` are a
`Promise` (await them); theme-color comes from `export const viewport`; icons/manifest
use file conventions (`app/manifest.ts`, `app/apple-icon.tsx` via `next/og`).
The data layer is Convex: schema changes deploy with `npx convex dev` (local) or
`npx convex deploy` (production), not with the Next build. Verify changes with
`pnpm lint`, `pnpm typecheck`, `pnpm test` and a build before committing.
