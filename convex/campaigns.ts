import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("campaigns")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const get = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.get(args.campaignId);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    objective: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    mainMessage: v.optional(v.string()),
    slogan: v.optional(v.string()),
    offer: v.optional(v.string()),
    cta: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    visualDirection: v.optional(v.string()),
    mood: v.optional(v.string()),
    colourTreatment: v.optional(v.string()),
    photographyStyle: v.optional(v.string()),
    videoMotionStyle: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    selectedProductIds: v.optional(v.array(v.id("products_services"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const campaignId = await ctx.db.insert("campaigns", { ...args, status: "Draft" });

    // Create empty campaign memory
    await ctx.db.insert("campaign_memory", { campaignId });

    return campaignId;
  },
});

export const update = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    objective: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    mainMessage: v.optional(v.string()),
    slogan: v.optional(v.string()),
    offer: v.optional(v.string()),
    cta: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    visualDirection: v.optional(v.string()),
    mood: v.optional(v.string()),
    colourTreatment: v.optional(v.string()),
    photographyStyle: v.optional(v.string()),
    videoMotionStyle: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(v.string()),
    selectedProductIds: v.optional(v.array(v.id("products_services"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { campaignId, ...fields } = args;
    await ctx.db.patch(campaignId, fields);
  },
});

export const getMemory = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("campaign_memory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .unique();
  },
});

export const updateMemory = mutation({
  args: {
    campaignId: v.id("campaigns"),
    masterPrompt: v.optional(v.string()),
    visualDirection: v.optional(v.string()),
    negativeInstructions: v.optional(v.string()),
    preferredLighting: v.optional(v.string()),
    preferredColors: v.optional(v.array(v.string())),
    materials: v.optional(v.array(v.string())),
    environment: v.optional(v.string()),
    cameraStyle: v.optional(v.string()),
    slogans: v.optional(v.array(v.string())),
    teamNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const { campaignId, ...fields } = args;
    const existing = await ctx.db
      .query("campaign_memory")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("campaign_memory", { campaignId, ...fields });
    }
  },
});

export const getAnchors = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("campaign_anchors")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

export const addAnchor = mutation({
  args: {
    campaignId: v.id("campaigns"),
    imageUrl: v.string(),
    storageId: v.optional(v.string()),
    anchorType: v.string(),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
    generationId: v.optional(v.id("image_generations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("campaign_anchors", args);
  },
});

export const removeAnchor = mutation({
  args: { anchorId: v.id("campaign_anchors") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.anchorId);
  },
});
