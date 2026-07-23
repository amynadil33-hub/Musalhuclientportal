import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

async function requireUser(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      message: "Unauthenticated",
      code: "UNAUTHENTICATED",
    });
  return identity as { name?: string; email?: string };
}

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    let phrases = args.category
      ? await ctx.db
          .query("dhivehi_phrases")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect()
      : await ctx.db.query("dhivehi_phrases").order("desc").collect();
    if (!args.includeArchived) {
      phrases = phrases.filter((p) => p.status === "active");
    }
    return phrases;
  },
});

export const create = mutation({
  args: {
    englishMeaning: v.string(),
    dhivehiText: v.string(),
    category: v.string(),
    industry: v.optional(v.string()),
    tone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    return await ctx.db.insert("dhivehi_phrases", {
      ...args,
      status: "active",
      usageCount: 0,
      createdBy: identity.name ?? identity.email,
    });
  },
});

export const update = mutation({
  args: {
    phraseId: v.id("dhivehi_phrases"),
    englishMeaning: v.optional(v.string()),
    dhivehiText: v.optional(v.string()),
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    tone: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { phraseId, ...fields } = args;
    await ctx.db.patch(phraseId, fields);
  },
});

export const duplicate = mutation({
  args: { phraseId: v.id("dhivehi_phrases") },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    const source = await ctx.db.get(args.phraseId);
    if (!source)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const { _id, _creationTime, ...rest } = source;
    return await ctx.db.insert("dhivehi_phrases", {
      ...rest,
      englishMeaning: `${source.englishMeaning} (copy)`,
      usageCount: 0,
      createdBy: identity.name ?? identity.email,
    });
  },
});

export const incrementUsage = mutation({
  args: { phraseId: v.id("dhivehi_phrases") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const phrase = await ctx.db.get(args.phraseId);
    if (phrase) {
      await ctx.db.patch(args.phraseId, {
        usageCount: (phrase.usageCount ?? 0) + 1,
      });
    }
  },
});
