import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Data model for the faceless UGC autopilot.
 *
 * A user owns channels. A channel is one content brand: a theme (what the
 * videos are about), a style (how they look and sound) and a posting schedule.
 * Autopilot fills the schedule with videos, each video runs through the
 * pipeline (script -> render -> store -> approve -> post), and every post
 * collects metric snapshots over time.
 */

export const platform = v.union(
  v.literal("tiktok"),
  v.literal("instagram"),
  v.literal("youtube"),
  v.literal("facebook"),
);

export const videoStatus = v.union(
  v.literal("queued"), // created, waiting for a script
  v.literal("scripting"), // LLM is writing the script
  v.literal("rendering"), // submitted to the video model
  v.literal("storing"), // copying the finished file into R2
  v.literal("awaiting_approval"), // ready, channel requires sign-off
  v.literal("ready"), // ready and approved, posts scheduled
  v.literal("posted"), // every scheduled post went out
  v.literal("failed"),
  v.literal("rejected"), // a human turned it down
);

export const postStatus = v.union(
  v.literal("scheduled"),
  v.literal("publishing"),
  v.literal("published"),
  v.literal("failed"),
  v.literal("canceled"),
);

export const script = v.object({
  topic: v.string(),
  title: v.string(),
  hook: v.string(),
  voiceover: v.string(),
  onScreenText: v.array(v.string()),
  visualPrompt: v.string(),
  caption: v.string(),
  hashtags: v.array(v.string()),
});

export const channelStyle = v.object({
  presetId: v.string(), // see convex/lib/styles.ts
  voice: v.string(), // narration voice direction, e.g. "calm female, mid pace"
  captionStyle: v.string(),
  extraDirection: v.optional(v.string()), // free text the user adds on top
});

export default defineSchema({
  ...authTables,

  // Convex Auth's users table, extended with billing fields.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    credits: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
    // Ayrshare user profile that holds this user's linked social accounts.
    postingProfileKey: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  channels: defineTable({
    userId: v.id("users"),
    name: v.string(),
    theme: v.string(), // niche / subject, e.g. "personal finance tips"
    audience: v.optional(v.string()),
    language: v.string(), // BCP 47, e.g. "en"
    style: channelStyle,
    modelId: v.string(), // video model, see convex/lib/models.ts
    durationSec: v.number(),
    // Posting schedule: local "HH:MM" slots every day in `timezone`.
    timezone: v.string(),
    postTimes: v.array(v.string()),
    platforms: v.array(platform),
    autopilot: v.boolean(),
    approvalRequired: v.boolean(),
    // Hours ahead of a slot that autopilot starts producing its video.
    leadTimeHours: v.number(),
    archived: v.boolean(),
    // Why autopilot last skipped a slot (e.g. out of credits), shown to the user.
    autopilotIssue: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_autopilot", ["autopilot"]),

  socialAccounts: defineTable({
    userId: v.id("users"),
    platform,
    handle: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("disconnected")),
    lastSyncedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"]),

  videos: defineTable({
    userId: v.id("users"),
    channelId: v.id("channels"),
    status: videoStatus,
    origin: v.union(v.literal("autopilot"), v.literal("manual")),
    // The posting slot this video is for (epoch ms). Manual videos may omit it.
    slotAt: v.optional(v.number()),
    topicHint: v.optional(v.string()),
    script: v.optional(script),
    modelId: v.string(),
    durationSec: v.number(),
    aspectRatio: v.string(),
    creditsCharged: v.number(),
    renderRequestId: v.optional(v.string()),
    // Shared secret that authenticates the render-provider webhook for this video.
    renderToken: v.optional(v.string()),
    renderSubmittedAt: v.optional(v.number()),
    providerOutputUrl: v.optional(v.string()),
    videoKey: v.optional(v.string()), // R2 object key of the final file
    error: v.optional(v.string()),
    attempts: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_slot", ["channelId", "slotAt"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_render_request", ["renderRequestId"]),

  posts: defineTable({
    userId: v.id("users"),
    channelId: v.id("channels"),
    videoId: v.id("videos"),
    platform,
    status: postStatus,
    scheduledFor: v.number(),
    publishedAt: v.optional(v.number()),
    providerPostId: v.optional(v.string()),
    externalId: v.optional(v.string()),
    url: v.optional(v.string()),
    error: v.optional(v.string()),
    metricsUpdatedAt: v.optional(v.number()),
  })
    .index("by_video", ["videoId"])
    .index("by_channel", ["channelId"])
    .index("by_status_time", ["status", "scheduledFor"])
    .index("by_published", ["status", "publishedAt"]),

  // Point-in-time metrics for one post. Snapshots let us chart growth and
  // compute deltas instead of only showing the latest totals.
  metricSnapshots: defineTable({
    postId: v.id("posts"),
    channelId: v.id("channels"),
    videoId: v.id("videos"),
    platform,
    takenAt: v.number(),
    views: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.optional(v.number()),
    avgWatchTimeSec: v.optional(v.number()),
    completionRate: v.optional(v.number()), // 0..1
  })
    .index("by_post", ["postId", "takenAt"])
    .index("by_channel", ["channelId", "takenAt"]),

  creditLedger: defineTable({
    userId: v.id("users"),
    delta: v.number(), // + grant / purchase / refund, - spend
    reason: v.union(
      v.literal("signup_bonus"),
      v.literal("purchase"),
      v.literal("render"),
      v.literal("render_refund"),
      v.literal("script"),
      v.literal("adjustment"),
    ),
    refId: v.optional(v.string()), // video id, Stripe session id, ...
    at: v.number(),
  })
    .index("by_user", ["userId", "at"])
    .index("by_ref", ["refId"]),

  // User-uploaded assets in R2 (logos, reference images, background music).
  assets: defineTable({
    userId: v.id("users"),
    key: v.string(),
    kind: v.union(v.literal("image"), v.literal("audio"), v.literal("video")),
    name: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_key", ["key"]),
});
