import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_archived", (q) => q.eq("isArchived", false))
      .collect();

    if (args.includeArchived) {
      const archived = await ctx.db
        .query("clients")
        .withIndex("by_archived", (q) => q.eq("isArchived", true))
        .collect();
      return [...clients, ...archived];
    }

    return clients;
  },
});

export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.get(args.clientId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    industry: v.string(),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const clientId = await ctx.db.insert("clients", {
      name: args.name,
      industry: args.industry,
      logoUrl: args.logoUrl,
      logoStorageId: args.logoStorageId,
      isArchived: false,
      createdBy: identity.name ?? identity.email,
    });

    // Create empty brand profile and target audience
    await ctx.db.insert("brand_profiles", { clientId });
    await ctx.db.insert("target_audiences", { clientId });

    return clientId;
  },
});

export const update = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { clientId, ...fields } = args;
    await ctx.db.patch(clientId, fields);
  },
});

export const archive = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    await ctx.db.patch(args.clientId, { isArchived: true });
  },
});

export const restore = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    await ctx.db.patch(args.clientId, { isArchived: false });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const allClients = await ctx.db
      .query("clients")
      .withIndex("by_archived", (q) => q.eq("isArchived", false))
      .collect();

    const activeCampaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();

    const recentImages = await ctx.db
      .query("image_generations")
      .order("desc")
      .take(6);

    const recentReels = await ctx.db
      .query("reel_projects")
      .order("desc")
      .take(4);

    return {
      totalClients: allClients.length,
      activeCampaigns: activeCampaigns.length,
      recentImages,
      recentReels,
    };
  },
});
