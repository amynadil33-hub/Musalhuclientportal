import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

function requireAuth(identity: unknown) {
  if (!identity)
    throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
}

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const active = await ctx.db
      .query("dhivehi_phrases")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    let rows = active;
    if (args.includeArchived) {
      const archived = await ctx.db
        .query("dhivehi_phrases")
        .withIndex("by_active", (q) => q.eq("active", false))
        .collect();
      rows = [...active, ...archived];
    }
    if (args.category) {
      rows = rows.filter((p) => p.category === args.category);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.englishMeaning.toLowerCase().includes(q) ||
          p.dhivehiText.includes(args.search!) ||
          (p.category ?? "").toLowerCase().includes(q) ||
          (p.industry ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  },
});

export const create = mutation({
  args: {
    englishMeaning: v.string(),
    dhivehiText: v.string(),
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    tone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    return await ctx.db.insert("dhivehi_phrases", {
      ...args,
      usageCount: 0,
      active: true,
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
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const { phraseId, ...fields } = args;
    const clean = Object.fromEntries(
      Object.entries(fields).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(phraseId, clean);
  },
});

export const setArchived = mutation({
  args: { phraseId: v.id("dhivehi_phrases"), archived: v.boolean() },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    await ctx.db.patch(args.phraseId, { active: !args.archived });
  },
});

export const duplicate = mutation({
  args: { phraseId: v.id("dhivehi_phrases") },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const src = await ctx.db.get(args.phraseId);
    if (!src)
      throw new ConvexError({ message: "Phrase not found", code: "NOT_FOUND" });
    const { _id, _creationTime, ...rest } = src;
    return await ctx.db.insert("dhivehi_phrases", {
      ...rest,
      englishMeaning: `${src.englishMeaning} (copy)`,
      usageCount: 0,
      active: true,
    });
  },
});

export const incrementUsage = mutation({
  args: { phraseId: v.id("dhivehi_phrases") },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const phrase = await ctx.db.get(args.phraseId);
    if (phrase) {
      await ctx.db.patch(args.phraseId, {
        usageCount: (phrase.usageCount ?? 0) + 1,
      });
    }
  },
});
