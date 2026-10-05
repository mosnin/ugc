import { describe, expect, test } from "vitest";
import { getVideoModel, renderCost, snapDuration } from "./lib/models";
import { normalizeAnalytics } from "./lib/providers/ayrshare";
import { parseRenderPayload } from "./lib/providers/muapi";
import { buildScriptPrompt, normalizeScript, wordBudget } from "./lib/providers/openai";
import { isValidPostTime, isValidTimezone, upcomingSlots, zonedTimeToUtc } from "./lib/schedule";
import { verifyStripeSignature } from "./lib/stripe";
import { getStylePreset } from "./lib/styles";

describe("schedule", () => {
  test("validates post times and timezones", () => {
    expect(isValidPostTime("09:30")).toBe(true);
    expect(isValidPostTime("24:00")).toBe(false);
    expect(isValidPostTime("9:30")).toBe(false);
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Mars/Base")).toBe(false);
  });

  test("converts local wall time to UTC across DST", () => {
    // New York is UTC-4 in July and UTC-5 in January.
    expect(new Date(zonedTimeToUtc(2026, 7, 1, 9, 0, "America/New_York")).toISOString()).toBe(
      "2026-07-01T13:00:00.000Z",
    );
    expect(new Date(zonedTimeToUtc(2026, 1, 15, 9, 0, "America/New_York")).toISOString()).toBe(
      "2026-01-15T14:00:00.000Z",
    );
    expect(new Date(zonedTimeToUtc(2026, 7, 1, 0, 30, "Asia/Kolkata")).toISOString()).toBe(
      "2026-06-30T19:00:00.000Z",
    );
  });

  test("lists slots inside the window only, sorted", () => {
    const from = Date.parse("2026-07-01T12:00:00Z");
    const to = Date.parse("2026-07-02T12:00:00Z");
    const slots = upcomingSlots(["21:00", "09:00", "bad"], "America/New_York", from, to);
    expect(slots.map((s) => new Date(s).toISOString())).toEqual([
      "2026-07-01T13:00:00.000Z", // 09:00 EDT
      "2026-07-02T01:00:00.000Z", // 21:00 EDT
    ]);
    expect(upcomingSlots([], "UTC", from, to)).toEqual([]);
  });
});

describe("models", () => {
  test("snaps duration to a supported length and prices it", () => {
    const sora = getVideoModel("sora-2")!;
    expect(snapDuration(sora, 12)).toBe(10);
    expect(snapDuration(sora, 14)).toBe(15);
    expect(renderCost(sora, 10)).toBe(120);
  });
});

describe("script provider", () => {
  test("prompt carries style, word budget and recent titles", () => {
    const { system, user } = buildScriptPrompt({
      theme: "personal finance",
      language: "en",
      style: getStylePreset("reddit-story"),
      voice: "calm",
      captionStyle: "bold",
      durationSec: 10,
      modelHasAudio: true,
      recentTitles: ["Old video"],
    });
    expect(system).toMatch(/faceless/);
    expect(user).toContain("Reddit story");
    expect(user).toContain(`about ${wordBudget(10)} words`);
    expect(user).toContain("Old video");
    expect(user).toMatch(/narration verbatim/);
  });

  test("normalizes output and strips em and en dashes", () => {
    const s = normalizeScript({
      topic: "Saving \u2014 the easy way",
      title: "x",
      hook: "Stop \u2013 now",
      voiceover: "v",
      onScreenText: ["a", 3, ""],
      visualPrompt: "p",
      caption: "c",
      hashtags: ["#money", "save more"],
    });
    expect(s.topic).not.toMatch(/[\u2013\u2014]/);
    expect(s.hook).not.toMatch(/[\u2013\u2014]/);
    expect(s.onScreenText).toEqual(["a"]);
    expect(s.hashtags).toEqual(["money", "savemore"]);
  });
});

describe("render provider", () => {
  test("parses MuAPI payloads", () => {
    expect(parseRenderPayload({ status: "completed", outputs: ["https://x/v.mp4"] })).toEqual({
      state: "completed",
      outputUrl: "https://x/v.mp4",
    });
    expect(parseRenderPayload({ status: "failed", error: "nsfw" })).toEqual({ state: "failed", error: "nsfw" });
    expect(parseRenderPayload({ status: "processing" })).toEqual({ state: "processing" });
    expect(parseRenderPayload({ status: "completed", outputs: [] })).toEqual({ state: "processing" });
  });
});

describe("analytics", () => {
  test("reads per-network field names", () => {
    expect(normalizeAnalytics({ videoViews: 10, likes: 2, comments: 1, shares: 0, fullVideoWatchedRate: 45 })).toEqual({
      views: 10,
      likes: 2,
      comments: 1,
      shares: 0,
      saves: undefined,
      avgWatchTimeSec: undefined,
      completionRate: 0.45,
    });
    expect(normalizeAnalytics({ plays: "7", likeCount: 3 })?.views).toBe(7);
    expect(normalizeAnalytics(undefined)).toBeUndefined();
  });
});

describe("stripe signatures", () => {
  async function sign(payload: string, secret: string, t: number) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  test("accepts a valid signature and rejects tampering or replay", async () => {
    const t = 1_800_000_000;
    const body = '{"id":"evt_1"}';
    const v1 = await sign(body, "whsec_test", t);
    expect(await verifyStripeSignature(body, `t=${t},v1=${v1}`, "whsec_test", t)).toBe(true);
    expect(await verifyStripeSignature(body + " ", `t=${t},v1=${v1}`, "whsec_test", t)).toBe(false);
    expect(await verifyStripeSignature(body, `t=${t},v1=${v1}`, "other", t)).toBe(false);
    expect(await verifyStripeSignature(body, `t=${t},v1=${v1}`, "whsec_test", t + 3600)).toBe(false);
    expect(await verifyStripeSignature(body, null, "whsec_test", t)).toBe(false);
  });
});
