import { R2 } from "@convex-dev/r2";
import { components } from "../_generated/api";

/** The R2 bucket configured by the R2_* environment variables. */
export const r2 = new R2(components.r2);

export function videoObjectKey(userId: string, videoId: string): string {
  return `videos/${userId}/${videoId}.mp4`;
}
