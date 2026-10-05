import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { requireEnv, requireUserId } from "./lib/access";
import { grantCredits } from "./lib/credits";
import { createCheckoutSession, CREDIT_PACKS, getPack } from "./lib/stripe";

export const packs = query({
  args: {},
  handler: async () => CREDIT_PACKS,
});

/** Current balance and the most recent ledger entries. */
export const balance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    const ledger = await ctx.db
      .query("creditLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return { credits: user?.credits ?? 0, ledger };
  },
});

export const userEmail = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => (await ctx.db.get(userId))?.email,
});

/** Start a Stripe Checkout for a credit pack. Returns the URL to send the user to. */
export const checkout = action({
  args: { packId: v.string() },
  handler: async (ctx, { packId }): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not signed in");
    const pack = getPack(packId);
    if (!pack) throw new ConvexError("Unknown credit pack");
    const siteUrl = requireEnv("SITE_URL");
    const email = await ctx.runQuery(internal.billing.userEmail, { userId });
    const session = await createCheckoutSession(
      {
        pack,
        userId,
        email: email ?? undefined,
        successUrl: `${siteUrl}/dashboard?checkout=success`,
        cancelUrl: `${siteUrl}/dashboard?checkout=canceled`,
      },
      { secretKey: requireEnv("STRIPE_SECRET_KEY") },
    );
    return session.url;
  },
});

/** Credit a paid Checkout Session. Idempotent on the session id. */
export const fulfillCheckout = internalMutation({
  args: { sessionId: v.string(), userId: v.string(), packId: v.string() },
  handler: async (ctx, { sessionId, userId, packId }) => {
    const already = await ctx.db
      .query("creditLedger")
      .withIndex("by_ref", (q) => q.eq("refId", sessionId))
      .first();
    if (already) return "duplicate";
    const pack = getPack(packId);
    const uid = ctx.db.normalizeId("users", userId);
    if (!pack || !uid || !(await ctx.db.get(uid))) return "invalid";
    await grantCredits(ctx, uid, pack.credits, "purchase", sessionId);
    return "credited";
  },
});
