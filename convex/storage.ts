"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { r2, videoObjectKey } from "./lib/r2";

/**
 * Copy a finished render from the provider's temporary URL into our R2
 * bucket. Runs in the Node runtime for its larger memory limit: rendered
 * videos can be tens of megabytes.
 */
export const storeOutput = internalAction({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const video = await ctx.runQuery(internal.pipeline.getVideo, { videoId });
    if (!video || video.status !== "storing" || !video.providerOutputUrl) return;
    try {
      const res = await fetch(video.providerOutputUrl);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const key = await r2.store(ctx, bytes, {
        key: videoObjectKey(video.userId, videoId),
        type: res.headers.get("content-type") || "video/mp4",
      });
      await ctx.runMutation(internal.pipeline.videoStored, { videoId, key });
    } catch (err) {
      await ctx.runMutation(internal.pipeline.failVideo, {
        videoId,
        expectStatus: "storing",
        error: `Storage: ${(err as Error).message}`,
      });
    }
  },
});

