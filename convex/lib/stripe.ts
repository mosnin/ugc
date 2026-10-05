/**
 * Minimal Stripe client over fetch (no SDK, so it runs in the default Convex
 * runtime): create a Checkout Session for a credit pack and verify webhooks.
 */

export type CreditPack = { id: string; name: string; credits: number; priceCents: number };

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter, 1,000 credits", credits: 1_000, priceCents: 1_000 },
  { id: "creator", name: "Creator, 3,000 credits", credits: 3_000, priceCents: 2_500 },
  { id: "studio", name: "Studio, 10,000 credits", credits: 10_000, priceCents: 6_900 },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export async function createCheckoutSession(
  args: { pack: CreditPack; userId: string; email?: string; successUrl: string; cancelUrl: string },
  opts: { secretKey: string; fetchImpl?: typeof fetch },
): Promise<{ id: string; url: string }> {
  const form = new URLSearchParams({
    mode: "payment",
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.userId,
    "metadata[userId]": args.userId,
    "metadata[packId]": args.pack.id,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(args.pack.priceCents),
    "line_items[0][price_data][product_data][name]": args.pack.name,
  });
  if (args.email) form.set("customer_email", args.email);
  const res = await (opts.fetchImpl ?? fetch)("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`Stripe ${res.status}: ${data.error?.message ?? "could not create checkout"}`);
  }
  return { id: data.id, url: data.url };
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify a `Stripe-Signature` header against the raw body. */
export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  const sigs = parts.filter(([k]) => k === "v1").map(([, val]) => val);
  if (!Number.isFinite(t) || sigs.length === 0 || Math.abs(nowSec - t) > toleranceSec) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const expected = toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)));
  return sigs.some((s) => timingSafeEqual(s, expected));
}
