# UGC - Product

_Set 2026-10-05 from founder direction. Living draft: the founder corrects it._

## What it is

**An autopilot for faceless short-form channels.** A creator picks a content
style and a channel theme once. UGC then runs the whole loop on a schedule,
including while they sleep: it writes the script, renders the video, stores it,
posts it to TikTok, Instagram Reels, YouTube Shorts and Facebook, and measures
how each video performed.

Faceless means no presenter on camera: narration, b-roll, generated scenes,
motion graphics and captions carry every video.

## The loop

1. **Channel**: a content brand. Theme (what it is about), audience, language,
   style (a preset plus voice, caption style and extra direction), video model
   and length, posting times in a timezone, platforms, and whether each video
   needs approval before it posts.
2. **Autopilot**: every 15 minutes it fills each posting slot inside the
   channel's lead time with a video.
3. **Pipeline** per video: script (LLM) -> render (text-to-video model) -> copy
   into our storage -> approval (optional) -> one post per platform at the slot.
4. **Metrics**: published posts are snapshotted on a decaying schedule; the
   channel view shows growth, platform split, watch time and the top hooks.

## Objects

User (credits) - Channel - Video - Post - Metric snapshot - Social account -
Credit ledger entry - Asset (user uploads).

## Business model (placeholder numbers)

Credits. New accounts get 200. A script costs 1 credit; a render costs the
model's per-second rate times the length (see `convex/lib/models.ts`). Packs are
sold through Stripe Checkout (`convex/lib/stripe.ts`). Prices and pack sizes are
placeholders until the founder sets real ones against provider costs.

## Where it came from

Forked from the Sicarii/Scalar app (a CRM run by AI agents). Every Scalar
feature was removed on 2026-10-05; its docs live in `docs/archive/scalar/`.
Product and UI references imported under `vendor/` (see `vendor/README.md`):
Open-AI-UGC (the dashboard the UI is modelled on), Open-Higgsfield-AI (studio
features) and UGC-Factory (script and style craft).
