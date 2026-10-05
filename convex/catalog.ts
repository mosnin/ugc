import { query } from "./_generated/server";
import { VIDEO_MODELS } from "./lib/models";
import { STYLE_PRESETS } from "./lib/styles";

/** Content style presets a channel can pick from. */
export const styles = query({
  args: {},
  handler: async () =>
    STYLE_PRESETS.map(({ id, name, description, defaultVoice, defaultCaptionStyle }) => ({
      id,
      name,
      description,
      defaultVoice,
      defaultCaptionStyle,
    })),
});

/** Video models with their allowed lengths and credit cost per second. */
export const models = query({
  args: {},
  handler: async () =>
    VIDEO_MODELS.map(({ id, name, durations, aspectRatios, audio, creditsPerSecond }) => ({
      id,
      name,
      durations,
      aspectRatios,
      audio,
      creditsPerSecond,
    })),
});
