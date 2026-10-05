import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { getVideoModel, renderCost, SCRIPT_COST } from "./lib/models";
import { upcomingSlots } from "./lib/schedule";
import { startPipeline } from "./pipeline";

/**
 * Autopilot keeps every enabled channel's schedule filled: for each posting
 * slot inside the channel's lead time, it makes sure a video exists, and
 * starts the pipeline for any slot that has none.
 */

// Slots closer than this are skipped: a video could not be produced in time.
const MIN_LEAD_MS = 15 * 60_000;
// Cap on new videos per channel per planning run, so a long lead time or a
// misconfigured schedule cannot burn through credits in one go.
const MAX_NEW_PER_RUN = 6;

export const planAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_autopilot", (q) => q.eq("autopilot", true))
      .collect();
    for (const c of channels) {
      await ctx.scheduler.runAfter(0, internal.autopilot.planChannel, { channelId: c._id });
    }
  },
});

export const planChannel = internalMutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const channel = await ctx.db.get(channelId);
    if (!channel || !channel.autopilot || channel.archived) return { created: 0 };
    const model = getVideoModel(channel.modelId);
    if (!model) return { created: 0 };

    const now = Date.now();
    const slots = upcomingSlots(
      channel.postTimes,
      channel.timezone,
      now + MIN_LEAD_MS,
      now + channel.leadTimeHours * 3_600_000,
    );

    const costPerVideo = SCRIPT_COST + renderCost(model, channel.durationSec);
    let credits = (await ctx.db.get(channel.userId))?.credits ?? 0;
    let created = 0;
    let issue: string | undefined;

    for (const slotAt of slots) {
      if (created >= MAX_NEW_PER_RUN) break;
      const existing = await ctx.db
        .query("videos")
        .withIndex("by_channel_slot", (q) => q.eq("channelId", channelId).eq("slotAt", slotAt))
        .first();
      // Any video holds its slot. Failed or rejected ones are not replaced
      // automatically: the user retries them or makes a new one by hand.
      if (existing) continue;
      if (credits < costPerVideo) {
        issue = `Out of credits: each video needs ${costPerVideo}, you have ${credits}.`;
        break;
      }
      const videoId = await ctx.db.insert("videos", {
        userId: channel.userId,
        channelId,
        status: "queued",
        origin: "autopilot",
        slotAt,
        modelId: channel.modelId,
        durationSec: channel.durationSec,
        aspectRatio: "9:16",
        creditsCharged: 0,
        attempts: 0,
      });
      await startPipeline(ctx, videoId);
      // Reserve against the local balance; the pipeline does the real spending.
      credits -= costPerVideo;
      created++;
    }

    if (issue !== channel.autopilotIssue) await ctx.db.patch(channelId, { autopilotIssue: issue });
    return { created };
  },
});
