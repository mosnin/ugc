import { ConvexError, v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/access";
import { r2 } from "./lib/r2";

/**
 * User uploads to R2 (logos, reference images, music). The client uses
 * `useUploadFile(api.files)` from "@convex-dev/r2/react", which calls these two.
 */
export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx) => {
    await requireUserId(ctx);
  },
  onUpload: async (ctx, _bucket, key) => {
    const userId = await requireUserId(ctx);
    const meta = await r2.getMetadata(ctx, key);
    const type = meta?.contentType ?? "";
    const kind = type.startsWith("image/") ? "image" : type.startsWith("audio/") ? "audio" : "video";
    await ctx.db.insert("assets", { userId, key, kind });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
    return Promise.all(assets.map(async (a) => ({ ...a, url: await r2.getUrl(a.key) })));
  },
});

export const remove = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, { assetId }) => {
    const userId = await requireUserId(ctx);
    const asset = await ctx.db.get(assetId);
    if (!asset || asset.userId !== userId) throw new ConvexError("File not found");
    await r2.deleteObject(ctx, asset.key);
    await ctx.db.delete(assetId);
  },
});
