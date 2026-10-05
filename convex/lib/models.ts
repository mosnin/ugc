/**
 * Text-to-video models available through MuAPI, with the parameters we send
 * and what a render costs in credits. Endpoints and parameter ranges come from
 * the MuAPI catalogue used by Open-Higgsfield-AI (vendor/open-higgsfield-ai).
 *
 * `audio: true` models generate a soundtrack with narration from the prompt,
 * which is what a faceless video needs when no separate voiceover track is
 * mixed in.
 */
export type VideoModel = {
  id: string;
  name: string;
  endpoint: string;
  durations: number[]; // allowed clip lengths in seconds
  aspectRatios: string[];
  audio: boolean;
  creditsPerSecond: number;
  extraParams?: Record<string, string | number | boolean>;
};

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "veo-3.1-fast",
    name: "Veo 3.1 Fast",
    endpoint: "veo3.1-fast-text-to-video",
    durations: [8],
    aspectRatios: ["9:16", "16:9"],
    audio: true,
    creditsPerSecond: 10,
    extraParams: { resolution: "1080p" },
  },
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    endpoint: "veo3.1-text-to-video",
    durations: [8],
    aspectRatios: ["9:16", "16:9"],
    audio: true,
    creditsPerSecond: 25,
    extraParams: { resolution: "1080p" },
  },
  {
    id: "sora-2",
    name: "Sora 2",
    endpoint: "openai-sora-2-text-to-video",
    durations: [10, 15],
    aspectRatios: ["9:16", "16:9"],
    audio: true,
    creditsPerSecond: 12,
  },
  {
    id: "seedance-2",
    name: "Seedance 2.0",
    endpoint: "seedance-v2.0-t2v",
    durations: [5, 10, 15],
    aspectRatios: ["9:16", "16:9", "3:4", "4:3"],
    audio: false,
    creditsPerSecond: 6,
    extraParams: { quality: "basic" },
  },
  {
    id: "kling-3-pro",
    name: "Kling v3.0 Pro",
    endpoint: "kling-v3.0-pro-text-to-video",
    durations: [5, 10],
    aspectRatios: ["9:16", "16:9", "1:1"],
    audio: false,
    creditsPerSecond: 8,
  },
];

export const DEFAULT_MODEL_ID = "veo-3.1-fast";

export function getVideoModel(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === id);
}

/** Snap a requested duration to the closest length the model supports. */
export function snapDuration(model: VideoModel, requested: number): number {
  return model.durations.reduce((best, d) =>
    Math.abs(d - requested) < Math.abs(best - requested) ? d : best,
  );
}

export function renderCost(model: VideoModel, durationSec: number): number {
  return Math.ceil(model.creditsPerSecond * durationSec);
}

/** Flat cost of writing one script with the LLM. */
export const SCRIPT_COST = 1;

/** Credits every new account starts with. */
export const SIGNUP_CREDITS = 200;
