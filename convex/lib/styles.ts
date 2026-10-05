/**
 * Content style presets: how a channel's videos look and sound. A channel
 * picks one preset and can layer its own direction on top. The `direction`
 * text goes straight into the script and video prompts, so write it as
 * instructions to the models.
 *
 * Every preset is faceless: no on-camera presenter, narration carries the
 * story, visuals are b-roll, motion graphics or generated scenes.
 */
export type StylePreset = {
  id: string;
  name: string;
  description: string;
  direction: string;
  defaultVoice: string;
  defaultCaptionStyle: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "bold-captions-broll",
    name: "Bold captions + b-roll",
    description: "Punchy narration over fast stock-style b-roll with big word-by-word captions.",
    direction:
      "Fast cuts of cinematic stock-style b-roll that literally illustrates each sentence. New shot every 1 to 2 seconds. No people facing the camera, no faces in close-up. Bright, high-contrast grade.",
    defaultVoice: "confident narrator, mid-fast pace, conversational",
    defaultCaptionStyle: "huge bold uppercase, 2 to 3 words at a time, key word highlighted yellow",
  },
  {
    id: "reddit-story",
    name: "Reddit story",
    description: "A first-person story read aloud over satisfying gameplay-style loops.",
    direction:
      "Continuous, satisfying looping background footage (parkour run, marble run, kinetic sand) with no people and no text in the scene. The story is carried entirely by narration.",
    defaultVoice: "natural storyteller, slightly dramatic, first person",
    defaultCaptionStyle: "centered white bold captions with black outline, one line at a time",
  },
  {
    id: "dark-documentary",
    name: "Dark documentary",
    description: "Moody history, mystery and true-story explainers.",
    direction:
      "Moody, desaturated cinematic scenes: archival-style footage, slow push-ins on objects and places, fog, candlelight, maps. Slow, deliberate camera. No faces in focus.",
    defaultVoice: "deep, calm documentary narrator, slow pace",
    defaultCaptionStyle: "small elegant serif subtitles at the bottom",
  },
  {
    id: "motivation",
    name: "Motivation",
    description: "Quotes and short motivational monologues over epic visuals.",
    direction:
      "Epic, emotional visuals: mountain summits, athletes from behind or in silhouette, sunrise timelapses, city at night. Slow motion. Warm, filmic grade.",
    defaultVoice: "intense, resonant male narrator, building energy",
    defaultCaptionStyle: "bold white captions, one phrase at a time, centered",
  },
  {
    id: "facts-listicle",
    name: "Top facts listicle",
    description: "Numbered facts or tips, one clear visual per item.",
    direction:
      "Clean, bright visuals with one clear subject per fact, each item introduced by a large on-screen number. Smooth transitions between items. No faces.",
    defaultVoice: "upbeat, curious narrator, quick pace",
    defaultCaptionStyle: "large numbered headline per item plus word-by-word captions",
  },
  {
    id: "product-showcase",
    name: "Product showcase",
    description: "Faceless product demos: hands, close-ups and lifestyle shots.",
    direction:
      "Close-up product shots, hands-only demos, lifestyle scenes without visible faces, satisfying macro details. Studio-clean lighting.",
    defaultVoice: "friendly, enthusiastic creator voice, casual",
    defaultCaptionStyle: "bold captions with emoji accents, key benefit highlighted",
  },
  {
    id: "ai-cinematic",
    name: "AI cinematic",
    description: "Fully generated cinematic scenes for stories, myths and what-ifs.",
    direction:
      "Fully generated cinematic scenes with dramatic lighting and sweeping camera moves, film-like composition, consistent visual world across the video. Characters only as silhouettes or from behind.",
    defaultVoice: "cinematic trailer narrator, dramatic pauses",
    defaultCaptionStyle: "minimal white captions, lower third",
  },
  {
    id: "satisfying-asmr",
    name: "Satisfying / ASMR",
    description: "Oddly satisfying visuals with soft narration.",
    direction:
      "Oddly satisfying macro visuals: slicing, pouring, cleaning, perfect fits, slow and smooth. Soft natural light. No faces.",
    defaultVoice: "soft, close, calm narration",
    defaultCaptionStyle: "small lowercase captions, gentle fade",
  },
];

export function getStylePreset(id: string): StylePreset {
  return STYLE_PRESETS.find((s) => s.id === id) ?? STYLE_PRESETS[0];
}
