# 0001 - Pivot to UGC autopilot, backend on Convex + R2

_Date: 2026-10-05 · Status: SHIPPED (code), live providers unobserved_

## Decision

Replace every Sicarii/Scalar feature with the faceless UGC autopilot, and build
the backend on:

- **Convex** for the database, server functions, scheduling and crons
  (founder call).
- **Convex Auth** for login: email + password, Google optional (founder call).
- **Cloudflare R2** for video and upload storage through `@convex-dev/r2`
  (founder call).

Provider choices made in this cycle (not yet confirmed by the founder):

- **OpenAI** writes scripts (structured JSON output).
- **MuAPI** renders text-to-video (Veo 3.1, Sora 2, Seedance 2.0, Kling), the
  provider Open-AI-UGC and Open-Higgsfield-AI already use.
- **Ayrshare** posts to TikTok, Instagram, YouTube and Facebook and returns
  per-post analytics. None of the imported repos posts to social networks.
- **Stripe Checkout** sells credit packs (fetch-based client, no SDK).

## Removed

Prisma/Supabase, Clerk, Inngest, Upstash, UploadThing, x402, the MCP server,
OAuth server, CRM, enrichment, agent, voice and outreach code, their API
routes, scripts and tests, and the Scalar dashboard. Docs archived in
`docs/archive/scalar/`.

## Gates

| Gate | Verdict | Rung | Evidence |
|---|---|---|---|
| Desirable | PASS | asserted | Founder direction. Real users owed to reality. |
| Feasible | PASS | tested | 18 tests (unit + convex-test integration) cover slots across DST, autopilot fill and credit stop, script -> render -> authenticated webhook -> approval -> posts, refund + retry, publish claims, metrics roll-up, Stripe signature + idempotent fulfilment. Sign-up and route protection observed in a browser against a local Convex backend. |
| Deliverable | OPEN | reasoned | Providers are called per documented APIs but never against live accounts. |
| Viable | OPEN | asserted | Credit prices are placeholders; unit costs per render owed. |

## Debts owed to reality

1. Run one real video end to end with live OpenAI, MuAPI, R2 and Ayrshare keys.
2. Confirm Ayrshare analytics field names per network against real responses.
3. Price credits against real provider costs.
4. Faceless quality: a single generated clip with model-made narration is the
   v1 render. Multi-clip stitching, a separate TTS voice track and burned-in
   captions need an ffmpeg render worker (not built).
