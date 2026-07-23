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
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const all = await ctx.db.query("dhivehi_fonts").collect();
    const resolved = await Promise.all(
      all.map(async (font) => ({
        ...font,
        resolvedUrl: font.storageId
          ? await ctx.storage.getUrl(font.storageId)
          : (font.fontUrl ?? null),
      })),
    );
    if (args.includeInactive) return resolved;
    return resolved.filter((f) => f.active);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
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
    glyphValidationStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    return await ctx.db.insert("dhivehi_fonts", {
      ...args,
      active: false,
      createdBy: identity.name ?? identity.email,
    });
  },
});

export const update = mutation({
  args: {
    fontId: v.id("dhivehi_fonts"),
    displayName: v.optional(v.string()),
    fontWeight: v.optional(v.string()),
    fontStyle: v.optional(v.string()),
    isVariable: v.optional(v.boolean()),
    supportedUses: v.optional(v.array(v.string())),
    licenceName: v.optional(v.string()),
    licenceNotes: v.optional(v.string()),
    commercialUseConfirmed: v.optional(v.boolean()),
    glyphValidationStatus: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { fontId, ...fields } = args;
    if (fields.active === true) {
      const font = await ctx.db.get(fontId);
      if (font && font.glyphValidationStatus === "failed_to_load") {
        throw new ConvexError({
          message: "Cannot activate a font that failed to load",
          code: "VALIDATION_ERROR",
        });
      }
    }
    await ctx.db.patch(fontId, fields);
  },
});

export const remove = mutation({
  args: { fontId: v.id("dhivehi_fonts") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const font = await ctx.db.get(args.fontId);
    if (font?.storageId) {
      await ctx.storage.delete(font.storageId).catch(() => {});
    }
    await ctx.db.delete(args.fontId);
  },
});
