import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const create = mutation({
  args: {
    reelSceneId: v.optional(v.id("reel_scenes")),
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    provider: v.string(),
    inputImageUrl: v.optional(v.string()),
    motionPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("video_jobs", {
      ...args,
      status: "queued",
    });
  },
});

export const update = mutation({
  args: {
    jobId: v.id("video_jobs"),
    status: v.optional(v.string()),
    providerJobId: v.optional(v.string()),
    outputUrl: v.optional(v.string()),
    storageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { jobId, ...fields } = args;
    await ctx.db.patch(jobId, fields);
  },
});

export const get = query({
  args: { jobId: v.id("video_jobs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.get(args.jobId);
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("video_jobs")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(50);
  },
});
