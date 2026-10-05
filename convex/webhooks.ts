import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/** Validate an untrusted id string from a webhook URL. */
export const normalizeVideoId = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, { id }) => ctx.db.normalizeId("videos", id),
});
