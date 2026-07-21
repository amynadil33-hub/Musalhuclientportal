import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const record = mutation({
  args: {
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    type: v.string(),
    provider: v.string(),
    quality: v.optional(v.string()),
    durationSecs: v.optional(v.number()),
    numOutputs: v.optional(v.number()),
    estimatedCost: v.optional(v.number()),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const date = new Date().toISOString().slice(0, 10);
    return await ctx.db.insert("usage_records", { ...args, date });
  },
});

export const getMonthly = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().slice(0, 10);

    const records = await ctx.db
      .query("usage_records")
      .withIndex("by_date", (q) => q.gte("date", monthStartStr))
      .collect();

    const totalCost = records.reduce((sum, r) => sum + (r.estimatedCost ?? 0), 0);
    const totalImages = records.filter((r) => r.type === "image").length;
    const totalVideos = records.filter((r) => r.type === "video").length;

    return { totalCost, totalImages, totalVideos, records };
  },
});

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("app_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const setSetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const existing = await ctx.db
      .query("app_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("app_settings", { key: args.key, value: args.value });
    }
  },
});
