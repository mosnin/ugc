import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireChannel, requireVideo } from "./lib/access";
import { r2 } from "./lib/r2";
import { schedulePosts, startPipeline } from "./pipeline";

const PLAYBACK_URL_TTL_SEC = 60 * 60;

async function withMedia(ctx: QueryCtx, video: Doc<"videos">) {
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_video", (q) => q.eq("videoId", video._id))
    .collect();
  return {
    ...video,
    // Never expose the webhook secret to the client.
    renderToken: undefined,
    videoUrl: video.videoKey ? await r2.getUrl(video.videoKey, { expiresIn: PLAYBACK_URL_TTL_SEC }) : null,
    posts: posts.map(({ _id, platform, status, scheduledFor, publishedAt, url, error }) => ({
      _id,
      platform,
      status,
      scheduledFor,
      publishedAt,
      url,
      error,
    })),
  };
}

export const listByChannel = query({
  args: { channelId: v.id("channels"), limit: v.optional(v.number()) },
  handler: async (ctx, { channelId, limit }) => {
    await requireChannel(ctx, channelId);
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .order("desc")
      .take(Math.min(limit ?? 30, 100));
    return Promise.all(videos.map((vid) => withMedia(ctx, vid)));
  },
});

export const get = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => withMedia(ctx, (await requireVideo(ctx, videoId)).video),
});

/** Make one video now, outside the schedule, optionally about a given topic. */
export const create = mutation({
  args: { channelId: v.id("channels"), topicHint: v.optional(v.string()) },
  handler: async (ctx, { channelId, topicHint }) => {
    const { userId, channel } = await requireChannel(ctx, channelId);
    if (channel.archived) throw new ConvexError("This channel is archived");
    const videoId = await ctx.db.insert("videos", {
      userId,
      channelId,
      status: "queued",
      origin: "manual",
      topicHint: topicHint?.trim() || undefined,
      modelId: channel.modelId,
      durationSec: channel.durationSec,
      aspectRatio: "9:16",
      creditsCharged: 0,
      attempts: 0,
    });
    await startPipeline(ctx, videoId);
    return videoId;
  },
});

/** Approve a finished video: its posts are scheduled for its slot, or now if the slot passed. */
export const approve = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const { video } = await requireVideo(ctx, videoId);
    if (video.status !== "awaiting_approval") throw new ConvexError("This video is not waiting for approval");
    const channel = await ctx.db.get(video.channelId);
    if (!channel || channel.archived) throw new ConvexError("This channel is archived");
    await ctx.db.patch(videoId, { status: "ready" });
    await schedulePosts(ctx, video, channel);
  },
});

/** Reject a video. Anything not yet published is canceled. */
export const reject = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const { video } = await requireVideo(ctx, videoId);
    if (video.status !== "awaiting_approval" && video.status !== "ready") {
      throw new ConvexError("Only finished videos can be rejected");
    }
    await ctx.db.patch(videoId, { status: "rejected" });
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_video", (q) => q.eq("videoId", videoId))
      .collect();
    for (const p of posts) {
      if (p.status === "scheduled") await ctx.db.patch(p._id, { status: "canceled" });
    }
  },
});

/** Run a failed video through the pipeline again from the script step. */
export const retry = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const { video } = await requireVideo(ctx, videoId);
    if (video.status !== "failed") throw new ConvexError("Only failed videos can be retried");
    await ctx.db.patch(videoId, {
      status: "queued",
      error: undefined,
      script: undefined,
      attempts: 0,
      renderRequestId: undefined,
      renderToken: undefined,
    });
    await startPipeline(ctx, videoId);
  },
});
