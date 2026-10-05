import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { requireChannel, requireVideo } from "./lib/access";
import { getPostAnalytics } from "./lib/providers/ayrshare";

/**
 * Metrics: published posts are snapshotted on a decaying schedule (often while
 * a post is young, daily after that, never after 30 days). Queries roll the
 * latest snapshot per post up into channel and video views.
 */

const DAY = 86_400_000;
const TRACK_FOR_MS = 30 * DAY;

/** How stale a post's metrics may get, by post age. */
export function refreshInterval(ageMs: number): number {
  if (ageMs < 2 * DAY) return 3 * 3_600_000;
  if (ageMs < 7 * DAY) return 12 * 3_600_000;
  return DAY;
}

export const postsToRefresh = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const recent = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("status", "published").gte("publishedAt", now - TRACK_FOR_MS))
      .take(500);
    return recent
      .filter((p) => now - (p.metricsUpdatedAt ?? 0) >= refreshInterval(now - (p.publishedAt ?? now)))
      .slice(0, 100)
      .map((p) => p._id);
  },
});

export const refreshDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const ids = await ctx.runQuery(internal.metrics.postsToRefresh, {});
    for (const postId of ids) {
      await ctx.scheduler.runAfter(0, internal.metrics.refreshPost, { postId });
    }
  },
});

export const postForMetrics = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post?.providerPostId) return null;
    const user = await ctx.db.get(post.userId);
    if (!user?.postingProfileKey) return null;
    return { post, profileKey: user.postingProfileKey };
  },
});

export const refreshPost = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const job = await ctx.runQuery(internal.metrics.postForMetrics, { postId });
    const apiKey = process.env.AYRSHARE_API_KEY;
    if (!job || !apiKey) return;
    try {
      const metrics = await getPostAnalytics(
        { profileKey: job.profileKey, providerPostId: job.post.providerPostId!, platforms: [job.post.platform] },
        { apiKey },
      );
      const m = metrics[job.post.platform];
      await ctx.runMutation(internal.metrics.saveSnapshot, { postId, metrics: m ?? null });
    } catch {
      // Analytics are often unavailable for the first minutes after publishing.
      // Mark the attempt so we back off until the next interval.
      await ctx.runMutation(internal.metrics.saveSnapshot, { postId, metrics: null });
    }
  },
});

export const saveSnapshot = internalMutation({
  args: {
    postId: v.id("posts"),
    metrics: v.union(
      v.null(),
      v.object({
        views: v.number(),
        likes: v.number(),
        comments: v.number(),
        shares: v.number(),
        saves: v.optional(v.number()),
        avgWatchTimeSec: v.optional(v.number()),
        completionRate: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { postId, metrics }) => {
    const post = await ctx.db.get(postId);
    if (!post) return;
    const now = Date.now();
    await ctx.db.patch(postId, { metricsUpdatedAt: now });
    if (!metrics) return;
    await ctx.db.insert("metricSnapshots", {
      postId,
      channelId: post.channelId,
      videoId: post.videoId,
      platform: post.platform,
      takenAt: now,
      ...metrics,
    });
  },
});

// ---------------------------------------------------------------------------
// Read side

type Snapshot = Doc<"metricSnapshots">;

/** Latest snapshot per post, from snapshots sorted ascending by time. */
function latestPerPost(snaps: Snapshot[]): Map<Id<"posts">, Snapshot> {
  const latest = new Map<Id<"posts">, Snapshot>();
  for (const s of snaps) latest.set(s.postId, s);
  return latest;
}

/**
 * Channel dashboard numbers for the last `days` days: totals, a daily views
 * series, per-platform split and the best-performing videos.
 */
export const channelSummary = query({
  args: { channelId: v.id("channels"), days: v.optional(v.number()) },
  handler: async (ctx, { channelId, days }) => {
    await requireChannel(ctx, channelId);
    const windowDays = Math.min(Math.max(days ?? 7, 1), 90);
    const now = Date.now();
    const start = now - windowDays * DAY;

    // Snapshots from one day before the window give each post a baseline.
    const snaps = await ctx.db
      .query("metricSnapshots")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId).gte("takenAt", start - DAY))
      .collect();
    const baseline = latestPerPost(snaps.filter((s) => s.takenAt < start));
    const latest = latestPerPost(snaps);

    let views = 0;
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let watchSum = 0;
    let watchN = 0;
    let completionSum = 0;
    let completionN = 0;
    const byPlatform: Record<string, number> = {};
    const byVideo = new Map<Id<"videos">, number>();
    for (const [postId, s] of latest) {
      const b = baseline.get(postId);
      const gained = s.views - (b?.views ?? 0);
      views += gained;
      likes += s.likes - (b?.likes ?? 0);
      comments += s.comments - (b?.comments ?? 0);
      shares += s.shares - (b?.shares ?? 0);
      byPlatform[s.platform] = (byPlatform[s.platform] ?? 0) + gained;
      byVideo.set(s.videoId, (byVideo.get(s.videoId) ?? 0) + s.views);
      if (s.avgWatchTimeSec !== undefined) {
        watchSum += s.avgWatchTimeSec;
        watchN++;
      }
      if (s.completionRate !== undefined) {
        completionSum += s.completionRate;
        completionN++;
      }
    }

    // Daily series: total views at the end of each day across all posts.
    const series: { day: number; views: number }[] = [];
    for (let d = 0; d < windowDays; d++) {
      const dayEnd = start + (d + 1) * DAY;
      const atDayEnd = latestPerPost(snaps.filter((s) => s.takenAt < dayEnd));
      let total = 0;
      for (const s of atDayEnd.values()) total += s.views;
      series.push({ day: dayEnd - DAY, views: total });
    }

    const top = await Promise.all(
      [...byVideo.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([videoId, totalViews]) => {
          const video = await ctx.db.get(videoId);
          return { videoId, views: totalViews, title: video?.script?.title, hook: video?.script?.hook };
        }),
    );

    const postsInWindow = await ctx.db
      .query("posts")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    return {
      windowDays,
      views,
      likes,
      comments,
      shares,
      avgWatchTimeSec: watchN ? watchSum / watchN : null,
      completionRate: completionN ? completionSum / completionN : null,
      byPlatform,
      series,
      topVideos: top,
      postsPublished: postsInWindow.filter((p) => p.status === "published" && (p.publishedAt ?? 0) >= start)
        .length,
      postsScheduled: postsInWindow.filter((p) => p.status === "scheduled").length,
      postsFailed: postsInWindow.filter((p) => p.status === "failed" && p.scheduledFor >= start).length,
    };
  },
});

/** Per-post metric history for one video. */
export const videoMetrics = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    await requireVideo(ctx, videoId);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_video", (q) => q.eq("videoId", videoId))
      .collect();
    return Promise.all(
      posts.map(async (p) => ({
        postId: p._id,
        platform: p.platform,
        url: p.url,
        snapshots: await ctx.db
          .query("metricSnapshots")
          .withIndex("by_post", (q) => q.eq("postId", p._id))
          .collect(),
      })),
    );
  },
});
