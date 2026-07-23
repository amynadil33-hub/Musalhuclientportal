import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

function requireAuth(identity: unknown) {
  if (!identity)
    throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
}

export const list = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const active = await ctx.db
      .query("dhivehi_fonts")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    if (!args.includeInactive) return active;
    const inactive = await ctx.db
      .query("dhivehi_fonts")
      .withIndex("by_active", (q) => q.eq("active", false))
      .collect();
    return [...active, ...inactive];
  },
});

export const get = query({
  args: { fontId: v.id("dhivehi_fonts") },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    return await ctx.db.get(args.fontId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    requireAuth(await ctx.auth.getUserIdentity());
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    displayName: v.string(),
    cssFamily: v.string(),
    storageId: v.optional(v.string()),
    fontUrl: v.optional(v.string()),
    fileFormat: v.string(),
    fontWeight: v.optional(v.string()),
    fontStyle: v.optional(v.string()),
    isVariable: v.optional(v.boolean()),
    minWeight: v.optional(v.number()),
    maxWeight: v.optional(v.number()),
    supportedUses: v.optional(v.array(v.string())),
    licenceName: v.optional(v.string()),
    licenceNotes: v.optional(v.string()),
    commercialUseConfirmed: v.optional(v.boolean()),
    glyphValidationStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    requireAuth(identity);

    let fontUrl = args.fontUrl;
    if (!fontUrl && args.storageId) {
      fontUrl =
        (await ctx.storage.getUrl(args.storageId as Id<"_storage">)) ??
        undefined;
    }
    if (!fontUrl) {
      throw new ConvexError({
        message: "A font file or URL is required",
        code: "BAD_REQUEST",
      });
    }

    return await ctx.db.insert("dhivehi_fonts", {
      displayName: args.displayName,
      cssFamily: args.cssFamily,
      storageId: args.storageId,
      fontUrl,
      fileFormat: args.fileFormat,
      fontWeight: args.fontWeight,
      fontStyle: args.fontStyle,
      isVariable: args.isVariable,
      minWeight: args.minWeight,
      maxWeight: args.maxWeight,
      supportedUses: args.supportedUses,
      licenceName: args.licenceName,
      licenceNotes: args.licenceNotes,
      commercialUseConfirmed: args.commercialUseConfirmed,
      glyphValidationStatus: args.glyphValidationStatus ?? "pending",
      active: false,
      createdBy: identity?.name ?? identity?.email,
    });
  },
});

export const update = mutation({
  args: {
    fontId: v.id("dhivehi_fonts"),
    displayName: v.optional(v.string()),
    supportedUses: v.optional(v.array(v.string())),
    licenceName: v.optional(v.string()),
    licenceNotes: v.optional(v.string()),
    commercialUseConfirmed: v.optional(v.boolean()),
    fontWeight: v.optional(v.string()),
    fontStyle: v.optional(v.string()),
    isVariable: v.optional(v.boolean()),
    minWeight: v.optional(v.number()),
    maxWeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const { fontId, ...fields } = args;
    await ctx.db.patch(fontId, fields);
  },
});

export const setValidationStatus = mutation({
  args: {
    fontId: v.id("dhivehi_fonts"),
    glyphValidationStatus: v.string(),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    await ctx.db.patch(args.fontId, {
      glyphValidationStatus: args.glyphValidationStatus,
    });
  },
});

export const setActive = mutation({
  args: { fontId: v.id("dhivehi_fonts"), active: v.boolean() },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const font = await ctx.db.get(args.fontId);
    if (!font) throw new ConvexError({ message: "Font not found", code: "NOT_FOUND" });
    if (
      args.active &&
      (font.glyphValidationStatus === "failed" ||
        font.glyphValidationStatus === "unavailable")
    ) {
      throw new ConvexError({
        message:
          "This font cannot be activated because it does not contain Thaana glyphs.",
        code: "BAD_REQUEST",
      });
    }
    await ctx.db.patch(args.fontId, { active: args.active });
  },
});

export const remove = mutation({
  args: { fontId: v.id("dhivehi_fonts") },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const font = await ctx.db.get(args.fontId);
    if (font?.storageId) {
      try {
        await ctx.storage.delete(font.storageId as Id<"_storage">);
      } catch {
        // ignore storage deletion failure
      }
    }
    await ctx.db.delete(args.fontId);
  },
});
