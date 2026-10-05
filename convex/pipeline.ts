import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { requireEnv } from "./lib/access";
import { grantCredits, spendCredits } from "./lib/credits";
import { getVideoModel, renderCost, SCRIPT_COST } from "./lib/models";
import { generateScript } from "./lib/providers/openai";
import { fetchResult, parseRenderPayload, submitRender } from "./lib/providers/muapi";
import { getStylePreset } from "./lib/styles";
import { script as scriptValidator } from "./schema";

/**
 * The video pipeline:
 *
 *   queued -> scripting -> rendering -> storing -> awaiting_approval | ready -> posted
 *
 * Every step is a mutation that checks the current status before moving on,
 * so retries, duplicate webhooks and the polling fallback cannot double-run a
 * step or double-charge credits. Actions do the network calls in between.
 */

const MAX_RENDER_ATTEMPTS = 2;
const POLL_AFTER_MS = 3 * 60_000;
const RENDER_TIMEOUT_MS = 45 * 60_000;

/** Kick off the pipeline for a queued video. */
export async function startPipeline(ctx: MutationCtx, videoId: Id<"videos">) {
  await ctx.scheduler.runAfter(0, internal.pipeline.writeScript, { videoId });
}

// ---------------------------------------------------------------------------
// Step 1: script

export const beginScript = internalMutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "queued") return null;
    const channel = await ctx.db.get(video.channelId);
    if (!channel) return null;
    try {
      await spendCredits(ctx, video.userId, SCRIPT_COST, "script", videoId);
    } catch (err) {
      await ctx.db.patch(videoId, { status: "failed", error: (err as Error).message });
      return null;
    }
    await ctx.db.patch(videoId, { status: "scripting", error: undefined });
    const recent = await ctx.db
      .query("videos")
      .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
      .order("desc")
      .take(40);
    return {
      channel,
      video,
      recentTitles: recent.flatMap((r) => (r._id !== videoId && r.script ? [r.script.title] : [])),
    };
  },
});

export const writeScript = internalAction({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const job = await ctx.runMutation(internal.pipeline.beginScript, { videoId });
    if (!job) return;
    const { channel, video, recentTitles } = job;
    const model = getVideoModel(video.modelId);
    try {
      const script = await generateScript(
        {
          theme: channel.theme,
          audience: channel.audience,
          language: channel.language,
          style: getStylePreset(channel.style.presetId),
          voice: channel.style.voice,
          captionStyle: channel.style.captionStyle,
          extraDirection: channel.style.extraDirection,
          durationSec: video.durationSec,
          modelHasAudio: model?.audio ?? false,
          topicHint: video.topicHint,
          recentTitles,
        },
        { apiKey: requireEnv("OPENAI_API_KEY"), model: process.env.OPENAI_MODEL || "gpt-4.1-mini" },
      );
      await ctx.runMutation(internal.pipeline.saveScript, { videoId, script });
    } catch (err) {
      await ctx.runMutation(internal.pipeline.failVideo, {
        videoId,
        expectStatus: "scripting",
        error: `Script: ${(err as Error).message}`,
      });
    }
  },
});

export const saveScript = internalMutation({
  args: { videoId: v.id("videos"), script: scriptValidator },
  handler: async (ctx, { videoId, script }) => {
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "scripting") return;
    await ctx.db.patch(videoId, { script });
    await ctx.scheduler.runAfter(0, internal.pipeline.render, { videoId });
  },
});

// ---------------------------------------------------------------------------
// Step 2: render

/** Charge for the render and mint the webhook secret. Returns null if the step should not run. */
export const beginRender = internalMutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "scripting" || !video.script) return null;
    const model = getVideoModel(video.modelId);
    if (!model) {
      await ctx.db.patch(videoId, { status: "failed", error: `Unknown model ${video.modelId}` });
      return null;
    }
    const cost = renderCost(model, video.durationSec);
    try {
      await spendCredits(ctx, video.userId, cost, "render", videoId);
    } catch (err) {
      await ctx.db.patch(videoId, { status: "failed", error: (err as Error).message });
      return null;
    }
    const renderToken = crypto.randomUUID().replace(/-/g, "");
    await ctx.db.patch(videoId, {
      status: "rendering",
      creditsCharged: video.creditsCharged + cost,
      renderToken,
      renderRequestId: undefined,
      renderSubmittedAt: Date.now(),
      attempts: video.attempts + 1,
    });
    return {
      endpoint: model.endpoint,
      extraParams: model.extraParams,
      prompt: video.script.visualPrompt,
      aspectRatio: video.aspectRatio,
      durationSec: video.durationSec,
      renderToken,
    };
  },
});

export const render = internalAction({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const job = await ctx.runMutation(internal.pipeline.beginRender, { videoId });
    if (!job) return;
    const siteUrl = requireEnv("CONVEX_SITE_URL");
    const webhookUrl = `${siteUrl}/webhooks/muapi?video=${videoId}&token=${job.renderToken}`;
    try {
      const { requestId } = await submitRender(
        { ...job, webhookUrl },
        { apiKey: requireEnv("MUAPI_API_KEY") },
      );
      await ctx.runMutation(internal.pipeline.renderSubmitted, { videoId, requestId });
    } catch (err) {
      await ctx.runMutation(internal.pipeline.failVideo, {
        videoId,
        expectStatus: "rendering",
        error: `Render: ${(err as Error).message}`,
      });
    }
  },
});

export const renderSubmitted = internalMutation({
  args: { videoId: v.id("videos"), requestId: v.string() },
  handler: async (ctx, { videoId, requestId }) => {
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "rendering") return;
    await ctx.db.patch(videoId, { renderRequestId: requestId });
  },
});

/**
 * Apply a render result from the webhook or the poller. `token` must match
 * the secret minted for this render, which is how webhook calls authenticate.
 */
export const applyRenderResult = internalMutation({
  args: {
    videoId: v.id("videos"),
    token: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, { videoId, token, payload }) => {
    const video = await ctx.db.get(videoId);
    if (!video || !video.renderToken || video.renderToken !== token) return "unauthorized" as const;
    if (video.status !== "rendering") return "ignored" as const;
    const result = parseRenderPayload(payload ?? {});
    if (result.state === "processing") return "processing" as const;
    if (result.state === "failed") {
      await failRender(ctx, video, result.error);
      return "failed" as const;
    }
    await ctx.db.patch(videoId, { status: "storing", providerOutputUrl: result.outputUrl });
    await ctx.scheduler.runAfter(0, internal.storage.storeOutput, { videoId });
    return "completed" as const;
  },
});

/** Refund the render and either retry it or mark the video failed. */
async function failRender(ctx: MutationCtx, video: Doc<"videos">, error: string) {
  const model = getVideoModel(video.modelId);
  const cost = model ? renderCost(model, video.durationSec) : 0;
  const refund = Math.min(cost, video.creditsCharged);
  await grantCredits(ctx, video.userId, refund, "render_refund", video._id);
  const creditsCharged = video.creditsCharged - refund;
  if (video.attempts < MAX_RENDER_ATTEMPTS) {
    // Back to "scripting" so beginRender picks it up again with the same script.
    await ctx.db.patch(video._id, { status: "scripting", creditsCharged, error, renderToken: undefined });
    await ctx.scheduler.runAfter(30_000, internal.pipeline.render, { videoId: video._id });
  } else {
    await ctx.db.patch(video._id, { status: "failed", creditsCharged, error, renderToken: undefined });
  }
}

export const failVideo = internalMutation({
  args: {
    videoId: v.id("videos"),
    expectStatus: v.string(),
    error: v.string(),
  },
  handler: async (ctx, { videoId, expectStatus, error }) => {
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== expectStatus) return;
    if (video.status === "rendering") {
      await failRender(ctx, video, error);
    } else {
      await ctx.db.patch(videoId, { status: "failed", error });
    }
  },
});

/** Videos whose webhook is late: poll the provider for them. */
export const rendersToPoll = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - POLL_AFTER_MS;
    const rendering = await ctx.db
      .query("videos")
      .withIndex("by_status", (q) => q.eq("status", "rendering"))
      .take(200);
    return rendering
      .filter((r) => (r.renderSubmittedAt ?? 0) < cutoff)
      .map((r) => ({
        videoId: r._id,
        requestId: r.renderRequestId,
        token: r.renderToken ?? "",
        timedOut: Date.now() - (r.renderSubmittedAt ?? 0) > RENDER_TIMEOUT_MS,
      }));
  },
});

export const pollRenders = internalAction({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.runQuery(internal.pipeline.rendersToPoll, {});
    const apiKey = process.env.MUAPI_API_KEY;
    for (const job of jobs) {
      if (job.timedOut || !job.requestId || !apiKey) {
        if (job.timedOut) {
          await ctx.runMutation(internal.pipeline.failVideo, {
            videoId: job.videoId,
            expectStatus: "rendering",
            error: "Render timed out",
          });
        }
        continue;
      }
      const state = await fetchResult(job.requestId, { apiKey }).catch(() => null);
      if (!state || state.state === "processing") continue;
      await ctx.runMutation(internal.pipeline.applyRenderResult, {
        videoId: job.videoId,
        token: job.token,
        payload:
          state.state === "completed"
            ? { status: "completed", outputs: [state.outputUrl] }
            : { status: "failed", error: state.error },
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Step 3: the file is copied into R2 by storage.storeOutput, then approve or schedule

export const getVideo = internalQuery({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => ctx.db.get(videoId),
});

export const videoStored = internalMutation({
  args: { videoId: v.id("videos"), key: v.string() },
  handler: async (ctx, { videoId, key }) => {
    const video = await ctx.db.get(videoId);
    if (!video || video.status !== "storing") return;
    const channel = await ctx.db.get(video.channelId);
    await ctx.db.patch(videoId, { videoKey: key });
    if (!channel || channel.archived) {
      await ctx.db.patch(videoId, { status: "ready" });
    } else if (channel.approvalRequired) {
      await ctx.db.patch(videoId, { status: "awaiting_approval" });
    } else {
      await ctx.db.patch(videoId, { status: "ready" });
      await schedulePosts(ctx, { ...video, videoKey: key }, channel);
    }
  },
});

/** Create one post per channel platform at the video's slot (or now) and schedule publishing. */
export async function schedulePosts(ctx: MutationCtx, video: Doc<"videos">, channel: Doc<"channels">) {
  const existing = await ctx.db
    .query("posts")
    .withIndex("by_video", (q) => q.eq("videoId", video._id))
    .collect();
  const when = Math.max(video.slotAt ?? 0, Date.now());
  for (const p of channel.platforms) {
    if (existing.some((e) => e.platform === p && e.status !== "canceled" && e.status !== "failed")) continue;
    const postId = await ctx.db.insert("posts", {
      userId: video.userId,
      channelId: channel._id,
      videoId: video._id,
      platform: p,
      status: "scheduled",
      scheduledFor: when,
    });
    await ctx.scheduler.runAt(when, internal.posting.publish, { postId });
  }
}
