import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("reel_projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const get = query({
  args: { reelProjectId: v.id("reel_projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.get(args.reelProjectId);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    name: v.string(),
    objective: v.optional(v.string()),
    format: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("reel_projects", { ...args, status: "draft" });
  },
});

export const update = mutation({
  args: {
    reelProjectId: v.id("reel_projects"),
    name: v.optional(v.string()),
    objective: v.optional(v.string()),
    status: v.optional(v.string()),
    format: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { reelProjectId, ...fields } = args;
    await ctx.db.patch(reelProjectId, fields);
  },
});

export const getScenes = query({
  args: { reelProjectId: v.id("reel_projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("reel_scenes")
      .withIndex("by_reel_project", (q) => q.eq("reelProjectId", args.reelProjectId))
      .collect();
  },
});

export const addScene = mutation({
  args: {
    reelProjectId: v.id("reel_projects"),
    sceneNumber: v.number(),
    description: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
    motionPrompt: v.optional(v.string()),
    cameraMovement: v.optional(v.string()),
    duration: v.optional(v.number()),
    onScreenText: v.optional(v.string()),
    transition: v.optional(v.string()),
    videoProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("reel_scenes", {
      ...args,
      generationStatus: "idle",
    });
  },
});

export const updateScene = mutation({
  args: {
    sceneId: v.id("reel_scenes"),
    sceneNumber: v.optional(v.number()),
    description: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
    motionPrompt: v.optional(v.string()),
    cameraMovement: v.optional(v.string()),
    duration: v.optional(v.number()),
    onScreenText: v.optional(v.string()),
    transition: v.optional(v.string()),
    videoProvider: v.optional(v.string()),
    generationStatus: v.optional(v.string()),
    generatedClipUrl: v.optional(v.string()),
    videoJobId: v.optional(v.id("video_jobs")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { sceneId, ...fields } = args;
    await ctx.db.patch(sceneId, fields);
  },
});

export const deleteScene = mutation({
  args: { sceneId: v.id("reel_scenes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.sceneId);
  },
});
