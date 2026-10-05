import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireChannel, requireUserId } from "./lib/access";
import { DEFAULT_MODEL_ID, getVideoModel, snapDuration } from "./lib/models";
import { isValidPostTime, isValidTimezone } from "./lib/schedule";
import { getStylePreset, STYLE_PRESETS } from "./lib/styles";
import { platform } from "./schema";

const MAX_POSTS_PER_DAY = 12;

const styleInput = v.object({
  presetId: v.string(),
  voice: v.optional(v.string()),
  captionStyle: v.optional(v.string()),
  extraDirection: v.optional(v.string()),
});

function resolveStyle(input: {
  presetId: string;
  voice?: string;
  captionStyle?: string;
  extraDirection?: string;
}): Doc<"channels">["style"] {
  if (!STYLE_PRESETS.some((s) => s.id === input.presetId)) {
    throw new ConvexError(`Unknown style preset "${input.presetId}"`);
  }
  const preset = getStylePreset(input.presetId);
  return {
    presetId: preset.id,
    voice: input.voice?.trim() || preset.defaultVoice,
    captionStyle: input.captionStyle?.trim() || preset.defaultCaptionStyle,
    extraDirection: input.extraDirection?.trim() || undefined,
  };
}

function validateSchedule(timezone: string, postTimes: string[]) {
  if (!isValidTimezone(timezone)) throw new ConvexError(`Unknown timezone "${timezone}"`);
  if (postTimes.length === 0) throw new ConvexError("Add at least one posting time");
  if (postTimes.length > MAX_POSTS_PER_DAY) {
    throw new ConvexError(`At most ${MAX_POSTS_PER_DAY} posts a day`);
  }
  const bad = postTimes.find((t) => !isValidPostTime(t));
  if (bad) throw new ConvexError(`Posting times use 24h "HH:MM", got "${bad}"`);
}

function resolveModel(modelId: string, durationSec: number) {
  const model = getVideoModel(modelId);
  if (!model) throw new ConvexError(`Unknown video model "${modelId}"`);
  return { modelId: model.id, durationSec: snapDuration(model, durationSec) };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return channels.filter((c) => !c.archived);
  },
});

export const get = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => (await requireChannel(ctx, channelId)).channel,
});

export const create = mutation({
  args: {
    name: v.string(),
    theme: v.string(),
    audience: v.optional(v.string()),
    language: v.optional(v.string()),
    style: styleInput,
    modelId: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    timezone: v.string(),
    postTimes: v.array(v.string()),
    platforms: v.array(platform),
    approvalRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.name.trim()) throw new ConvexError("Name the channel");
    if (!args.theme.trim()) throw new ConvexError("Describe the channel theme");
    validateSchedule(args.timezone, args.postTimes);
    const { modelId, durationSec } = resolveModel(args.modelId ?? DEFAULT_MODEL_ID, args.durationSec ?? 8);
    return await ctx.db.insert("channels", {
      userId,
      name: args.name.trim(),
      theme: args.theme.trim(),
      audience: args.audience?.trim() || undefined,
      language: args.language ?? "en",
      style: resolveStyle(args.style),
      modelId,
      durationSec,
      timezone: args.timezone,
      postTimes: [...new Set(args.postTimes)].sort(),
      platforms: [...new Set(args.platforms)],
      autopilot: false,
      approvalRequired: args.approvalRequired ?? true,
      leadTimeHours: 6,
      archived: false,
    });
  },
});

export const update = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.optional(v.string()),
    theme: v.optional(v.string()),
    audience: v.optional(v.string()),
    language: v.optional(v.string()),
    style: v.optional(styleInput),
    modelId: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    timezone: v.optional(v.string()),
    postTimes: v.optional(v.array(v.string())),
    platforms: v.optional(v.array(platform)),
    approvalRequired: v.optional(v.boolean()),
    leadTimeHours: v.optional(v.number()),
  },
  handler: async (ctx, { channelId, ...args }) => {
    const { channel } = await requireChannel(ctx, channelId);
    const patch: Partial<Doc<"channels">> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.theme !== undefined) patch.theme = args.theme.trim();
    if (args.audience !== undefined) patch.audience = args.audience.trim() || undefined;
    if (args.language !== undefined) patch.language = args.language;
    if (args.style !== undefined) patch.style = resolveStyle(args.style);
    if (args.modelId !== undefined || args.durationSec !== undefined) {
      Object.assign(
        patch,
        resolveModel(args.modelId ?? channel.modelId, args.durationSec ?? channel.durationSec),
      );
    }
    if (args.timezone !== undefined || args.postTimes !== undefined) {
      const timezone = args.timezone ?? channel.timezone;
      const postTimes = args.postTimes ?? channel.postTimes;
      validateSchedule(timezone, postTimes);
      patch.timezone = timezone;
      patch.postTimes = [...new Set(postTimes)].sort();
    }
    if (args.platforms !== undefined) patch.platforms = [...new Set(args.platforms)];
    if (args.approvalRequired !== undefined) patch.approvalRequired = args.approvalRequired;
    if (args.leadTimeHours !== undefined) {
      if (args.leadTimeHours < 1 || args.leadTimeHours > 72) {
        throw new ConvexError("Lead time must be between 1 and 72 hours");
      }
      patch.leadTimeHours = args.leadTimeHours;
    }
    await ctx.db.patch(channelId, patch);
  },
});

/** Turn autopilot on or off. Turning it on plans the next slots right away. */
export const setAutopilot = mutation({
  args: { channelId: v.id("channels"), enabled: v.boolean() },
  handler: async (ctx, { channelId, enabled }) => {
    const { channel } = await requireChannel(ctx, channelId);
    if (enabled && channel.platforms.length === 0) {
      throw new ConvexError("Pick at least one platform to post to");
    }
    await ctx.db.patch(channelId, { autopilot: enabled });
    if (enabled) {
      await ctx.scheduler.runAfter(0, internal.autopilot.planChannel, { channelId });
    }
  },
});

/** Archive a channel: autopilot stops and posts that have not gone out are canceled. */
export const archive = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    await requireChannel(ctx, channelId);
    await ctx.db.patch(channelId, { archived: true, autopilot: false });
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();
    for (const p of posts) {
      if (p.status === "scheduled") await ctx.db.patch(p._id, { status: "canceled" });
    }
  },
});
