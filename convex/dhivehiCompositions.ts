import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";

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

// ---------- Compositions ----------

export const list = query({
  args: { clientId: v.optional(v.id("clients")) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const compositions = args.clientId
      ? await ctx.db
          .query("dhivehi_compositions")
          .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
          .order("desc")
          .collect()
      : await ctx.db
          .query("dhivehi_compositions")
          .order("desc")
          .take(100);
    return compositions.filter((c) => c.status !== "Archived");
  },
});

export const get = query({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.compositionId);
  },
});

export const getWithLayers = query({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const composition = await ctx.db.get(args.compositionId);
    if (!composition) return null;
    const layers = await ctx.db
      .query("dhivehi_layers")
      .withIndex("by_composition", (q) =>
        q.eq("compositionId", args.compositionId),
      )
      .collect();
    return { composition, layers: layers.sort((a, b) => a.zIndex - b.zIndex) };
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    sourceGenerationId: v.optional(v.id("image_generations")),
    title: v.string(),
    canvasWidth: v.number(),
    canvasHeight: v.number(),
    outputFormat: v.string(),
    backgroundStorageId: v.optional(v.string()),
    backgroundUrl: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    safeAreaPreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.insert("dhivehi_compositions", {
      ...args,
      status: "Draft",
      version: 1,
    });
  },
});

export const update = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    title: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    canvasWidth: v.optional(v.number()),
    canvasHeight: v.optional(v.number()),
    outputFormat: v.optional(v.string()),
    backgroundStorageId: v.optional(v.string()),
    backgroundUrl: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    safeAreaPreset: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { compositionId, ...fields } = args;
    await ctx.db.patch(compositionId, fields);
  },
});

export const archive = mutation({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.compositionId, { status: "Archived" });
  },
});

async function cloneComposition(
  ctx: any,
  source: Doc<"dhivehi_compositions">,
  overrides: Partial<Doc<"dhivehi_compositions">>,
) {
  const { _id, _creationTime, ...rest } = source;
  const newId = await ctx.db.insert("dhivehi_compositions", {
    ...rest,
    status: "Draft",
    ...overrides,
  });
  const layers = await ctx.db
    .query("dhivehi_layers")
    .withIndex("by_composition", (q: any) => q.eq("compositionId", _id))
    .collect();
  for (const layer of layers) {
    const { _id: lid, _creationTime: lct, ...layerRest } = layer;
    await ctx.db.insert("dhivehi_layers", {
      ...layerRest,
      compositionId: newId,
    });
  }
  return newId;
}

export const duplicate = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    title: v.optional(v.string()),
    canvasWidth: v.optional(v.number()),
    canvasHeight: v.optional(v.number()),
    outputFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const source = await ctx.db.get(args.compositionId);
    if (!source)
      throw new ConvexError({
        message: "Composition not found",
        code: "NOT_FOUND",
      });
    return await cloneComposition(ctx, source, {
      title: args.title ?? `${source.title} (copy)`,
      canvasWidth: args.canvasWidth ?? source.canvasWidth,
      canvasHeight: args.canvasHeight ?? source.canvasHeight,
      outputFormat: args.outputFormat ?? source.outputFormat,
      version: 1,
    });
  },
});

export const createVersion = mutation({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const source = await ctx.db.get(args.compositionId);
    if (!source)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    return await cloneComposition(ctx, source, {
      title: `${source.title} v${(source.version ?? 1) + 1}`,
      version: (source.version ?? 1) + 1,
      parentCompositionId: source.parentCompositionId ?? source._id,
    });
  },
});

// ---------- Layers ----------

const layerFields = {
  layerType: v.string(),
  language: v.optional(v.string()),
  text: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  imageStorageId: v.optional(v.string()),
  shape: v.optional(v.string()),
  fillColor: v.optional(v.string()),
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
  rotation: v.optional(v.number()),
  fontId: v.optional(v.id("dhivehi_fonts")),
  fontFamily: v.optional(v.string()),
  fontSize: v.optional(v.number()),
  fontWeight: v.optional(v.string()),
  lineHeight: v.optional(v.number()),
  letterSpacing: v.optional(v.number()),
  textAlign: v.optional(v.string()),
  direction: v.optional(v.string()),
  autoFit: v.optional(v.boolean()),
  maxLines: v.optional(v.number()),
  textColor: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  backgroundOpacity: v.optional(v.number()),
  padding: v.optional(v.number()),
  borderRadius: v.optional(v.number()),
  borderColor: v.optional(v.string()),
  borderWidth: v.optional(v.number()),
  textShadow: v.optional(v.boolean()),
  strokeColor: v.optional(v.string()),
  strokeWidth: v.optional(v.number()),
  opacity: v.optional(v.number()),
  zIndex: v.number(),
  locked: v.optional(v.boolean()),
  hidden: v.optional(v.boolean()),
  reviewStatus: v.optional(v.string()),
  startTime: v.optional(v.number()),
  endTime: v.optional(v.number()),
};

export const addLayer = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    ...layerFields,
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.insert("dhivehi_layers", args);
  },
});

export const updateLayer = mutation({
  args: {
    layerId: v.id("dhivehi_layers"),
    patch: v.object({
      text: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      imageStorageId: v.optional(v.string()),
      shape: v.optional(v.string()),
      fillColor: v.optional(v.string()),
      x: v.optional(v.number()),
      y: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      rotation: v.optional(v.number()),
      fontId: v.optional(v.id("dhivehi_fonts")),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      fontWeight: v.optional(v.string()),
      lineHeight: v.optional(v.number()),
      letterSpacing: v.optional(v.number()),
      textAlign: v.optional(v.string()),
      direction: v.optional(v.string()),
      autoFit: v.optional(v.boolean()),
      maxLines: v.optional(v.number()),
      textColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      backgroundOpacity: v.optional(v.number()),
      padding: v.optional(v.number()),
      borderRadius: v.optional(v.number()),
      borderColor: v.optional(v.string()),
      borderWidth: v.optional(v.number()),
      textShadow: v.optional(v.boolean()),
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
      opacity: v.optional(v.number()),
      zIndex: v.optional(v.number()),
      locked: v.optional(v.boolean()),
      hidden: v.optional(v.boolean()),
      reviewStatus: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.layerId, args.patch);
  },
});

export const removeLayer = mutation({
  args: { layerId: v.id("dhivehi_layers") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.layerId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
