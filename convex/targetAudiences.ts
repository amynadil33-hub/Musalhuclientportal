import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("target_audiences")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    clientId: v.id("clients"),
    location: v.optional(v.string()),
    ageGroup: v.optional(v.string()),
    customerType: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    buyerMotivations: v.optional(v.array(v.string())),
    painPoints: v.optional(v.array(v.string())),
    preferredLanguage: v.optional(v.string()),
    culturalConsiderations: v.optional(v.string()),
    campaignPlatforms: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const { clientId, ...fields } = args;
    const existing = await ctx.db
      .query("target_audiences")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("target_audiences", { clientId, ...fields });
    }
  },
});
