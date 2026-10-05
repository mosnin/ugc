import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type Reason = Doc<"creditLedger">["reason"];

/**
 * Atomically spend credits. Mutations are serializable transactions, so the
 * balance check and the deduction cannot race.
 */
export async function spendCredits(
  ctx: MutationCtx,
  userId: Id<"users">,
  amount: number,
  reason: Reason,
  refId?: string,
): Promise<void> {
  if (amount <= 0) return;
  const user = await ctx.db.get(userId);
  const balance = user?.credits ?? 0;
  if (balance < amount) {
    throw new ConvexError(`Not enough credits: this needs ${amount}, you have ${balance}.`);
  }
  await ctx.db.patch(userId, { credits: balance - amount });
  await ctx.db.insert("creditLedger", { userId, delta: -amount, reason, refId, at: Date.now() });
}

export async function grantCredits(
  ctx: MutationCtx,
  userId: Id<"users">,
  amount: number,
  reason: Reason,
  refId?: string,
): Promise<void> {
  if (amount <= 0) return;
  const user = await ctx.db.get(userId);
  await ctx.db.patch(userId, { credits: (user?.credits ?? 0) + amount });
  await ctx.db.insert("creditLedger", { userId, delta: amount, reason, refId, at: Date.now() });
}
