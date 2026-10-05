import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not signed in");
  return userId;
}

/** Load a channel the signed-in user owns, or throw. */
export async function requireChannel(
  ctx: Ctx,
  channelId: Id<"channels">,
): Promise<{ userId: Id<"users">; channel: Doc<"channels"> }> {
  const userId = await requireUserId(ctx);
  const channel = await ctx.db.get(channelId);
  if (!channel || channel.userId !== userId) throw new ConvexError("Channel not found");
  return { userId, channel };
}

export async function requireVideo(
  ctx: Ctx,
  videoId: Id<"videos">,
): Promise<{ userId: Id<"users">; video: Doc<"videos"> }> {
  const userId = await requireUserId(ctx);
  const video = await ctx.db.get(videoId);
  if (!video || video.userId !== userId) throw new ConvexError("Video not found");
  return { userId, video };
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}
