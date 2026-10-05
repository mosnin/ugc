import type { Infer } from "convex/values";
import type { script as scriptValidator } from "../../schema";
import type { StylePreset } from "../styles";

export type Script = Infer<typeof scriptValidator>;

export type ScriptRequest = {
  theme: string;
  audience?: string;
  language: string;
  style: StylePreset;
  voice: string;
  captionStyle: string;
  extraDirection?: string;
  durationSec: number;
  modelHasAudio: boolean;
  topicHint?: string;
  recentTitles: string[]; // avoid repeating these
};

const SCRIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["topic", "title", "hook", "voiceover", "onScreenText", "visualPrompt", "caption", "hashtags"],
  properties: {
    topic: { type: "string", description: "The specific idea this video covers." },
    title: { type: "string", description: "Short internal title, under 70 characters." },
    hook: { type: "string", description: "The first spoken line. Earns the first 2 seconds." },
    voiceover: { type: "string", description: "The full narration, hook included, sized to the duration." },
    onScreenText: { type: "array", items: { type: "string" }, description: "Caption beats in order." },
    visualPrompt: { type: "string", description: "Prompt for the text-to-video model." },
    caption: { type: "string", description: "Post caption for the platforms, without hashtags." },
    hashtags: { type: "array", items: { type: "string" }, description: "3 to 6 hashtags without the # sign." },
  },
} as const;

/** Spoken words that fit in a clip, at roughly 2.5 words per second. */
export function wordBudget(durationSec: number): number {
  return Math.max(8, Math.floor(durationSec * 2.5));
}

export function buildScriptPrompt(req: ScriptRequest): { system: string; user: string } {
  const words = wordBudget(req.durationSec);
  const system = [
    "You write scripts for faceless short-form videos (TikTok, Reels, Shorts).",
    "Structure: a hook in the first 2 seconds (bold claim, visible problem or curiosity gap), then the payoff, then a light call to follow.",
    "Never put a presenter on camera. Visuals are b-roll, generated scenes or motion graphics; narration carries the story.",
    "Be accurate. Do not invent statistics, quotes or named sources. Prefer timeless, verifiable ideas.",
    "Do not use em dashes or en dashes anywhere. Use commas, periods or a plain hyphen.",
    `Write in language "${req.language}".`,
  ].join("\n");

  const visualRule = req.modelHasAudio
    ? `The video model generates sound from the prompt, so visualPrompt must include the narration verbatim in quotes, the voice ("${req.voice}"), the visuals and the caption style ("${req.captionStyle}").`
    : "The video model is silent, so visualPrompt describes visuals, motion and on-screen text only.";

  const user = [
    `Channel theme: ${req.theme}`,
    req.audience ? `Audience: ${req.audience}` : null,
    `Visual style: ${req.style.name}. ${req.style.direction}`,
    req.extraDirection ? `Extra direction from the creator: ${req.extraDirection}` : null,
    `Duration: ${req.durationSec} seconds, vertical 9:16. Narration must fit in about ${words} words.`,
    visualRule,
    req.topicHint ? `Topic to cover: ${req.topicHint}` : "Pick a fresh, specific topic that fits the theme.",
    req.recentTitles.length
      ? `Do not repeat these recent videos:\n- ${req.recentTitles.slice(0, 30).join("\n- ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export async function generateScript(
  req: ScriptRequest,
  opts: { apiKey: string; model: string; fetchImpl?: typeof fetch },
): Promise<Script> {
  const { system, user } = buildScriptPrompt(req);
  const res = await (opts.fetchImpl ?? fetch)("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "faceless_script", strict: true, schema: SCRIPT_SCHEMA },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string; refusal?: string | null } }[];
  };
  const message = data.choices?.[0]?.message;
  if (!message?.content) {
    throw new Error(message?.refusal ? `Script refused: ${message.refusal}` : "Empty script response");
  }
  return normalizeScript(JSON.parse(message.content));
}

/** Coerce model output into the stored shape and strip dashes the copy rules ban. */
export function normalizeScript(raw: Record<string, unknown>): Script {
  const str = (v: unknown) => (typeof v === "string" ? v : "").replace(/[\u2013\u2014]/g, ", ").trim();
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
  return {
    topic: str(raw.topic),
    title: str(raw.title).slice(0, 120),
    hook: str(raw.hook),
    voiceover: str(raw.voiceover),
    onScreenText: arr(raw.onScreenText),
    visualPrompt: str(raw.visualPrompt),
    caption: str(raw.caption),
    hashtags: arr(raw.hashtags).map((h) => h.replace(/^#/, "").replace(/\s+/g, "")).slice(0, 8),
  };
}
