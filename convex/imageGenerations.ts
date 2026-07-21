import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listByClient = query({
  args: { clientId: v.id("clients"), paginationOpts: v.optional(v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) })) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("image_generations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(50);
  },
});

export const listByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("image_generations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .take(50);
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("image_generations")
      .order("desc")
      .take(args.limit ?? 12);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    productId: v.optional(v.id("products_services")),
    shortPrompt: v.string(),
    fullPrompt: v.string(),
    platform: v.optional(v.string()),
    format: v.optional(v.string()),
    quality: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("image_generations", {
      ...args,
      status: "pending",
    });
  },
});

export const updateResult = mutation({
  args: {
    generationId: v.id("image_generations"),
    imageUrls: v.optional(v.array(v.string())),
    storageIds: v.optional(v.array(v.string())),
    status: v.string(),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { generationId, ...fields } = args;
    await ctx.db.patch(generationId, fields);
  },
});

export const markAsAnchor = mutation({
  args: {
    generationId: v.id("image_generations"),
    anchorType: v.string(),
    isAnchor: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    await ctx.db.patch(args.generationId, {
      isAnchor: args.isAnchor,
      anchorType: args.anchorType,
    });
  },
});
