# Backend - Convex

_Updated 2026-10-05._

Everything server-side lives in `convex/`. Next.js only renders pages and runs
the Convex Auth proxy (`src/proxy.ts`).

## Modules

| File | What it holds |
|---|---|
| `schema.ts` | Tables: Convex Auth tables, `users` (+ credits, Stripe and Ayrshare ids), `channels`, `socialAccounts`, `videos`, `posts`, `metricSnapshots`, `creditLedger`, `assets` |
| `auth.ts`, `auth.config.ts` | Convex Auth: Password, plus Google when `AUTH_GOOGLE_ID` is set. New users get `SIGNUP_CREDITS` with a ledger entry |
| `channels.ts` | Channel CRUD, `setAutopilot`, `archive` |
| `catalog.ts` | Style presets and video models for the UI |
| `autopilot.ts` | `planAll` (cron) and `planChannel`: fill slots inside the lead time, stop with `autopilotIssue` when credits run out |
| `pipeline.ts` | Script and render steps, render webhook/poll handling, refunds and retry, `videoStored`, `schedulePosts` |
| `storage.ts` | Node action that copies a finished render into R2 |
| `videos.ts` | Public video API: list, get (signed playback URL), create, approve, reject, retry |
| `posting.ts` | Ayrshare profile + account linking, `publish`, `dispatchDue` (cron safety net) |
| `metrics.ts` | Snapshot refresh (cron) and `channelSummary` / `videoMetrics` queries |
| `billing.ts` | Credit packs, `balance`, Stripe `checkout`, idempotent `fulfillCheckout` |
| `files.ts` | User uploads to R2 (`useUploadFile(api.files)` on the client) |
| `users.ts` | `me` |
| `http.ts` | Convex Auth routes, `POST /webhooks/muapi`, `POST /webhooks/stripe` |
| `crons.ts` | autopilot 15 min, render poll 5 min, due posts 5 min, metrics hourly |
| `lib/` | Pure helpers and provider clients (`providers/openai.ts`, `muapi.ts`, `ayrshare.ts`, `stripe.ts`), schedule math, styles, models, credits, access checks |

## Video lifecycle

```
queued -> scripting -> rendering -> storing -> awaiting_approval -> ready -> posted
                 \          \           \                \
                  failed     (refund, one retry) failed   rejected
```

- `beginScript` charges `SCRIPT_COST`; `beginRender` charges the render cost
  and mints `renderToken`. A failed render is refunded and retried once.
- The render webhook URL is
  `<CONVEX_SITE_URL>/webhooks/muapi?video=<id>&token=<renderToken>`. A wrong
  token gets 403. `pollRenders` covers late webhooks and times renders out
  after 45 minutes.
- Posts are created one per channel platform at the video's slot (or now if the
  slot has passed) and published with `ctx.scheduler.runAt`.
  `beginPublish` claims a post atomically, so the scheduler and the cron safety
  net cannot publish twice.

## Running locally

```bash
pnpm install
npx convex dev          # creates/links a deployment, writes .env.local, watches convex/
pnpm dev                # Next.js on :3000
pnpm test               # vitest + convex-test
```

Set the deployment environment variables listed in `.env.local.example` with
`npx convex env set`. Convex Auth needs `SITE_URL`, `JWT_PRIVATE_KEY` and
`JWKS` (`npx @convex-dev/auth` generates them).

Without an account, `CONVEX_AGENT_MODE=anonymous npx convex dev` runs a local
backend on :3210, which is how this cycle was tested.

## Verified vs owed

- **Tested** (`convex/*.test.ts`): slot math across DST, autopilot fill and
  credit stop, the full pipeline with mocked providers including webhook auth,
  refund and retry, publish claiming, metrics roll-up, Stripe signature and
  idempotent fulfilment.
- **Observed**: sign-up, sign-in redirect and route protection in a browser
  against the local backend.
- **Owed**: any call to live OpenAI, MuAPI, R2, Ayrshare or Stripe. Request
  shapes follow their docs and the vendored repos but have not been exercised.
