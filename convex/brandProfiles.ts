import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
    return await ctx.db
      .query("brand_profiles")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    clientId: v.id("clients"),
    businessDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    instagramHandle: v.optional(v.string()),
    facebookHandle: v.optional(v.string()),
    tiktokHandle: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    notes: v.optional(v.string()),
    primaryColors: v.optional(v.array(v.string())),
    secondaryColors: v.optional(v.array(v.string())),
    preferredFonts: v.optional(v.array(v.string())),
    brandPersonality: v.optional(v.string()),
    toneOfVoice: v.optional(v.string()),
    visualKeywords: v.optional(v.array(v.string())),
    preferredPhotographyStyle: v.optional(v.string()),
    preferredEnvironments: v.optional(v.array(v.string())),
    preferredLighting: v.optional(v.string()),
    preferredMaterials: v.optional(v.array(v.string())),
    preferredPeopleRepresentation: v.optional(v.string()),
    stylesToAvoid: v.optional(v.array(v.string())),
    colorsToAvoid: v.optional(v.array(v.string())),
    wordsToUse: v.optional(v.array(v.string())),
    wordsToAvoid: v.optional(v.array(v.string())),
    ctaStyle: v.optional(v.string()),
    dvHeadlineFontId: v.optional(v.id("dhivehi_fonts")),
    dvSubheadlineFontId: v.optional(v.id("dhivehi_fonts")),
    dvBodyFontId: v.optional(v.id("dhivehi_fonts")),
    dvPriceFontId: v.optional(v.id("dhivehi_fonts")),
    dvCtaFontId: v.optional(v.id("dhivehi_fonts")),
    enHeadlineFont: v.optional(v.string()),
    enBodyFont: v.optional(v.string()),
    minHeadlineSize: v.optional(v.number()),
    minBodySize: v.optional(v.number()),
    preferredHeadlineLineHeight: v.optional(v.number()),
    maxHeadlineLines: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const { clientId, ...fields } = args;
    const existing = await ctx.db
      .query("brand_profiles")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("brand_profiles", { clientId, ...fields });
    }
  },
});
