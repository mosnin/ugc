# Decision ledger

Patterns that pass, debts owed, kills. The Ratchet hook injects this every
session. Scalar-era decisions (0001-0014) are archived in
`docs/archive/scalar/decisions/`; they do not bind the UGC product.

## Decisions

| # | Decision | Status |
|---|---|---|
| 0001 | Pivot to UGC autopilot; Convex + Convex Auth + R2 backend | SHIPPED (code) |

## Patterns that pass

- **Status-guarded steps.** Every pipeline step is a mutation that checks the
  current status before moving on, so retries, duplicate webhooks and the
  polling fallback cannot double-run a step or double-charge.
- **Charge in the mutation, refund on failure.** Credits are spent atomically
  in the same transaction that advances the video, and refunded in the one that
  records the failure.
- **Webhooks carry a per-job secret.** The render callback URL holds a token
  minted for that render; Stripe webhooks are HMAC-verified.
- **Providers are plain fetch clients with an injectable `fetchImpl`**, so they
  run in the default Convex runtime and are unit-testable.

## Debts owed

See `0001-ugc-backend-on-convex.md`: live provider run, Ayrshare analytics
field names, real credit pricing, ffmpeg render worker.

## Kills

None yet.
