import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("products_services")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    price: v.optional(v.string()),
    promotionalPrice: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    cta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("products_services", { ...args, isActive: true });
  },
});

export const update = mutation({
  args: {
    productId: v.id("products_services"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    price: v.optional(v.string()),
    promotionalPrice: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    cta: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    const { productId, ...fields } = args;
    await ctx.db.patch(productId, fields);
  },
});

export const remove = mutation({
  args: { productId: v.id("products_services") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.productId);
  },
});
