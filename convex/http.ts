import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { verifyStripeSignature } from "./lib/stripe";

const http = httpRouter();
auth.addHttpRoutes(http);

/**
 * MuAPI render callback. The URL we hand MuAPI carries the video id and a
 * per-render secret token; the mutation rejects calls whose token does not
 * match, so this endpoint cannot be used to forge results.
 */
http.route({
  path: "/webhooks/muapi",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const videoParam = url.searchParams.get("video");
    const token = url.searchParams.get("token");
    if (!videoParam || !token) return new Response("Missing video or token", { status: 400 });
    const videoId = await ctx.runQuery(internal.webhooks.normalizeVideoId, { id: videoParam });
    if (!videoId) return new Response("Unknown video", { status: 404 });
    const payload = await req.json().catch(() => null);
    const outcome = await ctx.runMutation(internal.pipeline.applyRenderResult, { videoId, token, payload });
    if (outcome === "unauthorized") return new Response("Forbidden", { status: 403 });
    return Response.json({ ok: true, outcome });
  }),
});

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return new Response("Stripe is not configured", { status: 500 });
    const body = await req.text();
    if (!(await verifyStripeSignature(body, req.headers.get("stripe-signature"), secret))) {
      return new Response("Bad signature", { status: 400 });
    }
    const event = JSON.parse(body) as {
      type: string;
      data: { object: { id: string; payment_status?: string; metadata?: Record<string, string> } };
    };
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      if (session.payment_status === "paid" && session.metadata?.userId && session.metadata?.packId) {
        await ctx.runMutation(internal.billing.fulfillCheckout, {
          sessionId: session.id,
          userId: session.metadata.userId,
          packId: session.metadata.packId,
        });
      }
    }
    return Response.json({ received: true });
  }),
});

export default http;
