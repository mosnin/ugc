import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

const NOW = Date.parse("2026-07-01T12:00:00Z");

const SCRIPT = {
  topic: "The 50/30/20 rule",
  title: "50/30/20 in 30 seconds",
  hook: "Your budget is broken, here is the fix.",
  voiceover: "Your budget is broken, here is the fix. Fifty for needs...",
  onScreenText: ["50 needs", "30 wants", "20 savings"],
  visualPrompt: "Fast b-roll of coins and calendars",
  caption: "The simplest budget there is.",
  hashtags: ["money", "budget"],
};

type FetchCall = { url: string; body: unknown };
let calls: FetchCall[] = [];

function mockFetch() {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      const body = typeof init?.body === "string" && init.body.startsWith("{") ? JSON.parse(init.body) : init?.body;
      calls.push({ url, body });
      if (url.startsWith("https://api.openai.com/")) {
        return Response.json({ choices: [{ message: { content: JSON.stringify(SCRIPT) } }] });
      }
      if (url.startsWith("https://api.muapi.ai/")) {
        return Response.json({ request_id: "req_123" });
      }
      return new Response("unexpected", { status: 500 });
    }),
  );
}

async function setup(credits = 10_000) {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { email: "a@example.com", credits }));
  const as = t.withIdentity({ subject: `${userId}|session1` });
  const channelId = await as.mutation(api.channels.create, {
    name: "Money Facts Daily",
    theme: "personal finance tips",
    style: { presetId: "bold-captions-broll" },
    modelId: "veo-3.1-fast",
    timezone: "America/New_York",
    postTimes: ["09:00", "21:00"],
    platforms: ["tiktok", "youtube"],
  });
  return { t, as, userId, channelId };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  process.env.OPENAI_API_KEY = "sk-test";
  process.env.MUAPI_API_KEY = "mu-test";
  process.env.CONVEX_SITE_URL = "https://example.convex.site";
  mockFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("channels", () => {
  test("validates input and resolves style defaults", async () => {
    const { t, as, channelId } = await setup();
    const channel = await as.query(api.channels.get, { channelId });
    expect(channel.style.voice).toMatch(/narrator/);
    expect(channel.durationSec).toBe(8); // snapped to Veo's only length
    expect(channel.approvalRequired).toBe(true);
    await expect(
      as.mutation(api.channels.update, { channelId, postTimes: ["9am"] }),
    ).rejects.toThrow(/HH:MM/);

    // Another user cannot see it.
    const otherId = await t.run((ctx) => ctx.db.insert("users", {}));
    const other = t.withIdentity({ subject: `${otherId}|s` });
    await expect(other.query(api.channels.get, { channelId })).rejects.toThrow(/not found/);
  });
});

describe("autopilot", () => {
  test("fills each slot in the lead window once", async () => {
    const { t, as, channelId } = await setup();
    await as.mutation(api.channels.update, { channelId, leadTimeHours: 24 });
    await t.run((ctx) => ctx.db.patch(channelId, { autopilot: true }));

    const first = await t.mutation(internal.autopilot.planChannel, { channelId });
    // 12:00Z now, next 24h: 09:00 EDT today (13:00Z) and 21:00 EDT (01:00Z).
    expect(first.created).toBe(2);
    const second = await t.mutation(internal.autopilot.planChannel, { channelId });
    expect(second.created).toBe(0);

    const videos = await t.run((ctx) => ctx.db.query("videos").collect());
    expect(videos.map((v) => new Date(v.slotAt!).toISOString()).sort()).toEqual([
      "2026-07-01T13:00:00.000Z",
      "2026-07-02T01:00:00.000Z",
    ]);
  });

  test("stops and explains when credits run out", async () => {
    const { t, as, channelId } = await setup(5);
    await as.mutation(api.channels.update, { channelId, leadTimeHours: 24 });
    await t.run((ctx) => ctx.db.patch(channelId, { autopilot: true }));
    const res = await t.mutation(internal.autopilot.planChannel, { channelId });
    expect(res.created).toBe(0);
    const channel = await t.run((ctx) => ctx.db.get(channelId));
    expect(channel?.autopilotIssue).toMatch(/Out of credits/);
  });
});

describe("pipeline", () => {
  async function scriptAndRender(t: Awaited<ReturnType<typeof setup>>["t"], videoId: Id<"videos">) {
    await t.action(internal.pipeline.writeScript, { videoId });
    await t.action(internal.pipeline.render, { videoId });
    return t.run((ctx) => ctx.db.get(videoId));
  }

  test("script -> render -> webhook -> approval -> posts", async () => {
    const { t, as, userId, channelId } = await setup();
    const videoId = await as.mutation(api.videos.create, { channelId, topicHint: "budgeting" });

    const video = await scriptAndRender(t, videoId);
    expect(video?.status).toBe("rendering");
    expect(video?.script?.title).toBe(SCRIPT.title);
    expect(video?.renderRequestId).toBe("req_123");
    // 1 for the script + 8s x 10 credits for Veo 3.1 Fast.
    expect((await t.run((ctx) => ctx.db.get(userId)))?.credits).toBe(10_000 - 1 - 80);

    const muapiCall = calls.find((c) => c.url.includes("veo3.1-fast-text-to-video"));
    const body = muapiCall?.body as { webhook_url: string; aspect_ratio: string; resolution: string };
    expect(body.aspect_ratio).toBe("9:16");
    expect(body.resolution).toBe("1080p");
    expect(body.webhook_url).toContain(`video=${videoId}`);
    const token = new URL(body.webhook_url).searchParams.get("token")!;

    // The webhook is authenticated by the per-render token.
    const forged = await t.fetch(`/webhooks/muapi?video=${videoId}&token=nope`, {
      method: "POST",
      body: JSON.stringify({ status: "completed", outputs: ["https://evil/x.mp4"] }),
    });
    expect(forged.status).toBe(403);
    const ok = await t.fetch(`/webhooks/muapi?video=${videoId}&token=${token}`, {
      method: "POST",
      body: JSON.stringify({ status: "completed", outputs: ["https://cdn.muapi.ai/out.mp4"] }),
    });
    expect(ok.status).toBe(200);
    expect((await t.run((ctx) => ctx.db.get(videoId)))?.status).toBe("storing");

    // storage.storeOutput copies into R2; here we apply its result directly.
    await t.mutation(internal.pipeline.videoStored, { videoId, key: `videos/${userId}/${videoId}.mp4` });
    expect((await t.run((ctx) => ctx.db.get(videoId)))?.status).toBe("awaiting_approval");

    await as.mutation(api.videos.approve, { videoId });
    const posts = await t.run((ctx) => ctx.db.query("posts").collect());
    expect(posts.map((p) => p.platform).sort()).toEqual(["tiktok", "youtube"]);
    expect(posts.every((p) => p.status === "scheduled" && p.scheduledFor === NOW)).toBe(true);
  });

  test("a failed render is refunded, retried once, then marked failed", async () => {
    const { t, as, userId, channelId } = await setup();
    const videoId = await as.mutation(api.videos.create, { channelId });
    let video = await scriptAndRender(t, videoId);
    const token = video!.renderToken!;

    await t.mutation(internal.pipeline.applyRenderResult, {
      videoId,
      token,
      payload: { status: "failed", error: "content policy" },
    });
    video = await t.run((ctx) => ctx.db.get(videoId));
    expect(video?.status).toBe("scripting"); // queued for the retry
    expect(video?.creditsCharged).toBe(0);
    expect((await t.run((ctx) => ctx.db.get(userId)))?.credits).toBe(10_000 - 1);

    await t.action(internal.pipeline.render, { videoId });
    video = await t.run((ctx) => ctx.db.get(videoId));
    expect(video?.attempts).toBe(2);
    await t.mutation(internal.pipeline.applyRenderResult, {
      videoId,
      token: video!.renderToken!,
      payload: { status: "failed", error: "content policy" },
    });
    video = await t.run((ctx) => ctx.db.get(videoId));
    expect(video?.status).toBe("failed");
    expect(video?.error).toBe("content policy");
    expect((await t.run((ctx) => ctx.db.get(userId)))?.credits).toBe(10_000 - 1);

    // A stale duplicate webhook after failure changes nothing.
    const again = await t.mutation(internal.pipeline.applyRenderResult, {
      videoId,
      token: video!.renderToken ?? "",
      payload: { status: "completed", outputs: ["https://x"] },
    });
    expect(again).toBe("unauthorized");
  });

  test("not enough credits fails the video without charging", async () => {
    const { t, as, userId, channelId } = await setup(30);
    const videoId = await as.mutation(api.videos.create, { channelId });
    const video = await scriptAndRender(t, videoId);
    expect(video?.status).toBe("failed");
    expect(video?.error).toMatch(/Not enough credits/);
    expect((await t.run((ctx) => ctx.db.get(userId)))?.credits).toBe(29); // only the script
  });
});

describe("publishing", () => {
  test("needs a linked account, then marks the video posted when all posts are out", async () => {
    const { t, userId, channelId } = await setup();
    const videoId = await t.run((ctx) =>
      ctx.db.insert("videos", {
        userId,
        channelId,
        status: "ready",
        origin: "manual",
        script: SCRIPT,
        modelId: "veo-3.1-fast",
        durationSec: 8,
        aspectRatio: "9:16",
        creditsCharged: 80,
        attempts: 1,
        videoKey: "videos/k.mp4",
      }),
    );
    const mkPost = (platform: "tiktok" | "youtube") =>
      t.run((ctx) =>
        ctx.db.insert("posts", { userId, channelId, videoId, platform, status: "scheduled", scheduledFor: NOW }),
      );
    const tiktok = await mkPost("tiktok");

    expect(await t.mutation(internal.posting.beginPublish, { postId: tiktok })).toBeNull();
    expect((await t.run((ctx) => ctx.db.get(tiktok)))?.error).toBe("No social accounts linked");

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, { postingProfileKey: "pk_1" });
      for (const platform of ["tiktok", "youtube"] as const) {
        await ctx.db.insert("socialAccounts", { userId, platform, status: "active", lastSyncedAt: NOW });
      }
    });
    const p1 = await mkPost("tiktok");
    const p2 = await mkPost("youtube");

    const job = await t.mutation(internal.posting.beginPublish, { postId: p1 });
    expect(job?.caption).toBe(`${SCRIPT.caption}\n\n#money #budget`);
    // Claimed posts cannot be claimed twice.
    expect(await t.mutation(internal.posting.beginPublish, { postId: p1 })).toBeNull();

    await t.mutation(internal.posting.finishPublish, { postId: p1, ok: true, providerPostId: "ay_1" });
    expect((await t.run((ctx) => ctx.db.get(videoId)))?.status).toBe("ready");

    await t.mutation(internal.posting.beginPublish, { postId: p2 });
    await t.mutation(internal.posting.finishPublish, { postId: p2, ok: true, providerPostId: "ay_2" });
    expect((await t.run((ctx) => ctx.db.get(videoId)))?.status).toBe("posted");
  });
});

describe("metrics", () => {
  test("summarizes view growth inside the window", async () => {
    const { t, as, userId, channelId } = await setup();
    const DAY = 86_400_000;
    await t.run(async (ctx) => {
      const videoId = await ctx.db.insert("videos", {
        userId,
        channelId,
        status: "posted",
        origin: "autopilot",
        script: SCRIPT,
        modelId: "veo-3.1-fast",
        durationSec: 8,
        aspectRatio: "9:16",
        creditsCharged: 80,
        attempts: 1,
      });
      const postId = await ctx.db.insert("posts", {
        userId,
        channelId,
        videoId,
        platform: "tiktok",
        status: "published",
        scheduledFor: NOW - 10 * DAY,
        publishedAt: NOW - 10 * DAY,
      });
      const snap = (daysAgo: number, views: number) =>
        ctx.db.insert("metricSnapshots", {
          postId,
          channelId,
          videoId,
          platform: "tiktok",
          takenAt: NOW - daysAgo * DAY,
          views,
          likes: views / 10,
          comments: 0,
          shares: 0,
        });
      await snap(7.5, 1_000); // baseline, just before the 7-day window
      await snap(3, 4_000);
      await snap(0.5, 9_000);
    });
    const summary = await as.query(api.metrics.channelSummary, { channelId, days: 7 });
    expect(summary.views).toBe(8_000);
    expect(summary.likes).toBe(800);
    expect(summary.byPlatform).toEqual({ tiktok: 8_000 });
    expect(summary.series).toHaveLength(7);
    expect(summary.series.at(-1)?.views).toBe(9_000);
    expect(summary.topVideos[0]?.hook).toBe(SCRIPT.hook);
  });
});

describe("billing", () => {
  test("credits a paid checkout once", async () => {
    const { t, userId } = await setup(0);
    const args = { sessionId: "cs_1", userId, packId: "creator" };
    expect(await t.mutation(internal.billing.fulfillCheckout, args)).toBe("credited");
    expect(await t.mutation(internal.billing.fulfillCheckout, args)).toBe("duplicate");
    expect((await t.run((ctx) => ctx.db.get(userId)))?.credits).toBe(3_000);
    expect(await t.mutation(internal.billing.fulfillCheckout, { ...args, sessionId: "cs_2", packId: "nope" })).toBe(
      "invalid",
    );
  });
});
