import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { requireEnv, requireUserId } from "./lib/access";
import { createLinkUrl, createProfile, getLinkedAccounts, publishVideo } from "./lib/providers/ayrshare";
import { r2 } from "./lib/r2";
import { platform } from "./schema";

/**
 * Auto-posting through Ayrshare. Each user has one Ayrshare profile; they
 * link TikTok, Instagram, YouTube and Facebook to it on Ayrshare's hosted
 * page, and we publish each post row to its platform at its scheduled time.
 */

// Signed media URL lifetime handed to Ayrshare. It downloads at publish time.
const MEDIA_URL_TTL_SEC = 6 * 60 * 60;
const PLATFORMS = ["tiktok", "instagram", "youtube", "facebook"] as const;

function ayrshareOpts() {
  return { apiKey: requireEnv("AYRSHARE_API_KEY") };
}

export const accounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query("socialAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getUserPostingProfile = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return { profileKey: user?.postingProfileKey, email: user?.email };
  },
});

export const setPostingProfile = internalMutation({
  args: { userId: v.id("users"), profileKey: v.string() },
  handler: async (ctx, { userId, profileKey }) => {
    const user = await ctx.db.get(userId);
    // Keep the first profile if two link requests raced.
    if (user && !user.postingProfileKey) await ctx.db.patch(userId, { postingProfileKey: profileKey });
    return (await ctx.db.get(userId))?.postingProfileKey ?? profileKey;
  },
});

/** Returns a one-time URL where the user links their social accounts. */
export const linkAccountsUrl = action({
  args: { redirect: v.optional(v.string()) },
  handler: async (ctx, { redirect }): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not signed in");
    let { profileKey } = await ctx.runQuery(internal.posting.getUserPostingProfile, { userId });
    if (!profileKey) {
      const created = await createProfile(`user-${userId}`, ayrshareOpts());
      profileKey = await ctx.runMutation(internal.posting.setPostingProfile, {
        userId,
        profileKey: created.profileKey,
      });
    }
    return createLinkUrl(
      {
        profileKey,
        domain: requireEnv("AYRSHARE_DOMAIN"),
        privateKey: requireEnv("AYRSHARE_PRIVATE_KEY").replace(/\\n/g, "\n"),
        redirect,
      },
      ayrshareOpts(),
    );
  },
});

export const saveAccounts = internalMutation({
  args: {
    userId: v.id("users"),
    linked: v.array(v.object({ platform, handle: v.optional(v.string()) })),
  },
  handler: async (ctx, { userId, linked }) => {
    const now = Date.now();
    const current = await ctx.db
      .query("socialAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const p of PLATFORMS) {
      const row = current.find((c) => c.platform === p);
      const link = linked.find((l) => l.platform === p);
      if (link && row) {
        await ctx.db.patch(row._id, { status: "active", handle: link.handle, lastSyncedAt: now });
      } else if (link) {
        await ctx.db.insert("socialAccounts", {
          userId,
          platform: p,
          handle: link.handle,
          status: "active",
          lastSyncedAt: now,
        });
      } else if (row && row.status === "active") {
        await ctx.db.patch(row._id, { status: "disconnected", lastSyncedAt: now });
      }
    }
  },
});

/** Pull the user's currently linked accounts from Ayrshare. Call after they return from linking. */
export const syncAccounts = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not signed in");
    const { profileKey } = await ctx.runQuery(internal.posting.getUserPostingProfile, { userId });
    if (!profileKey) return;
    const linked = await getLinkedAccounts(profileKey, ayrshareOpts());
    await ctx.runMutation(internal.posting.saveAccounts, {
      userId,
      linked: linked.flatMap((l) =>
        (PLATFORMS as readonly string[]).includes(l.platform)
          ? [{ platform: l.platform as (typeof PLATFORMS)[number], handle: l.handle }]
          : [],
      ),
    });
  },
});

// ---------------------------------------------------------------------------
// Publishing

/** Claim a scheduled post for publishing. Returns null if it is not due or already claimed. */
export const beginPublish = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post || post.status !== "scheduled" || post.scheduledFor > Date.now() + 60_000) return null;
    const video = await ctx.db.get(post.videoId);
    const user = await ctx.db.get(post.userId);
    const fail = async (error: string) => {
      await ctx.db.patch(postId, { status: "failed", error });
      return null;
    };
    if (!video || video.status !== "ready" || !video.videoKey || !video.script) {
      return fail("Video is not ready to post");
    }
    if (!user?.postingProfileKey) return fail("No social accounts linked");
    const account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_user_platform", (q) => q.eq("userId", post.userId).eq("platform", post.platform))
      .first();
    if (!account || account.status !== "active") return fail(`No ${post.platform} account linked`);
    await ctx.db.patch(postId, { status: "publishing" });
    const hashtags = video.script.hashtags.map((h) => `#${h}`).join(" ");
    return {
      profileKey: user.postingProfileKey,
      platform: post.platform,
      videoKey: video.videoKey,
      title: video.script.title,
      caption: hashtags ? `${video.script.caption}\n\n${hashtags}` : video.script.caption,
    };
  },
});

export const finishPublish = internalMutation({
  args: {
    postId: v.id("posts"),
    ok: v.boolean(),
    providerPostId: v.optional(v.string()),
    externalId: v.optional(v.string()),
    url: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { postId, ok, ...rest }) => {
    const post = await ctx.db.get(postId);
    if (!post || post.status !== "publishing") return;
    if (!ok) {
      await ctx.db.patch(postId, { status: "failed", error: rest.error });
      return;
    }
    await ctx.db.patch(postId, {
      status: "published",
      publishedAt: Date.now(),
      providerPostId: rest.providerPostId,
      externalId: rest.externalId,
      url: rest.url,
      error: undefined,
    });
    // The video counts as posted once none of its posts are still pending.
    const siblings = await ctx.db
      .query("posts")
      .withIndex("by_video", (q) => q.eq("videoId", post.videoId))
      .collect();
    const pending = siblings.some(
      (s) => s._id !== postId && (s.status === "scheduled" || s.status === "publishing"),
    );
    if (!pending) await ctx.db.patch(post.videoId, { status: "posted" });
  },
});

export const publish = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const job = await ctx.runMutation(internal.posting.beginPublish, { postId });
    if (!job) return;
    try {
      const videoUrl = await r2.getUrl(job.videoKey, { expiresIn: MEDIA_URL_TTL_SEC });
      const result = await publishVideo(
        {
          profileKey: job.profileKey,
          platforms: [job.platform],
          caption: job.caption,
          title: job.title,
          videoUrl,
        },
        ayrshareOpts(),
      );
      const mine = result.perPlatform[0];
      await ctx.runMutation(internal.posting.finishPublish, {
        postId,
        ok: mine.ok,
        providerPostId: result.providerPostId,
        externalId: mine.externalId,
        url: mine.url,
        error: mine.error,
      });
    } catch (err) {
      await ctx.runMutation(internal.posting.finishPublish, {
        postId,
        ok: false,
        error: (err as Error).message,
      });
    }
  },
});

/** Safety net: publish anything due that the scheduler did not pick up. */
export const dispatchDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const due = await ctx.db
      .query("posts")
      .withIndex("by_status_time", (q) => q.eq("status", "scheduled").lte("scheduledFor", Date.now() - 2 * 60_000))
      .take(50);
    for (const p of due) {
      await ctx.scheduler.runAfter(0, internal.posting.publish, { postId: p._id });
    }
  },
});
