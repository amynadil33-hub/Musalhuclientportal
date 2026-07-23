import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

function requireAuth(identity: unknown) {
  if (!identity)
    throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
}

export const list = query({
  args: { clientId: v.optional(v.id("clients")) },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    if (args.clientId) {
      return await ctx.db
        .query("dhivehi_compositions")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
        .order("desc")
        .take(100);
    }
    return await ctx.db.query("dhivehi_compositions").order("desc").take(100);
  },
});

export const get = query({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const comp = await ctx.db.get(args.compositionId);
    if (!comp) return null;
    const exports = await ctx.db
      .query("dhivehi_exports")
      .withIndex("by_composition", (q) =>
        q.eq("compositionId", args.compositionId),
      )
      .order("desc")
      .take(20);
    return { ...comp, exports };
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
    layers: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    requireAuth(identity);
    return await ctx.db.insert("dhivehi_compositions", {
      clientId: args.clientId,
      campaignId: args.campaignId,
      sourceGenerationId: args.sourceGenerationId,
      title: args.title,
      canvasWidth: args.canvasWidth,
      canvasHeight: args.canvasHeight,
      outputFormat: args.outputFormat,
      backgroundStorageId: args.backgroundStorageId,
      backgroundUrl: args.backgroundUrl,
      backgroundColor: args.backgroundColor,
      layers: args.layers ?? [],
      status: "Draft",
      createdBy: identity?.name ?? identity?.email,
    });
  },
});

export const save = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    title: v.optional(v.string()),
    canvasWidth: v.optional(v.number()),
    canvasHeight: v.optional(v.number()),
    outputFormat: v.optional(v.string()),
    backgroundStorageId: v.optional(v.string()),
    backgroundUrl: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    layers: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    const { compositionId, ...fields } = args;
    const clean = Object.fromEntries(
      Object.entries(fields).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(compositionId, clean);
  },
});

export const setStatus = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    await ctx.db.patch(args.compositionId, { status: args.status });
  },
});

export const duplicate = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    title: v.optional(v.string()),
    outputFormat: v.optional(v.string()),
    canvasWidth: v.optional(v.number()),
    canvasHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    requireAuth(identity);
    const src = await ctx.db.get(args.compositionId);
    if (!src)
      throw new ConvexError({ message: "Composition not found", code: "NOT_FOUND" });
    const { _id, _creationTime, ...rest } = src;
    return await ctx.db.insert("dhivehi_compositions", {
      ...rest,
      title: args.title ?? `${src.title} (copy)`,
      outputFormat: args.outputFormat ?? src.outputFormat,
      canvasWidth: args.canvasWidth ?? src.canvasWidth,
      canvasHeight: args.canvasHeight ?? src.canvasHeight,
      status: "Draft",
      createdBy: identity?.name ?? identity?.email,
    });
  },
});

export const remove = mutation({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    await ctx.db.patch(args.compositionId, { status: "Archived" });
  },
});

// ---- Exports ----

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    requireAuth(await ctx.auth.getUserIdentity());
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveStorageUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
  },
});

export const recordExport = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    outputType: v.string(),
    width: v.number(),
    height: v.number(),
    storageId: v.optional(v.string()),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    // when true, also store as a creative_export so it appears in Reel Studio
    addToReelStudio: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    requireAuth(await ctx.auth.getUserIdentity());
    let url: string | undefined;
    if (args.storageId) {
      url =
        (await ctx.storage.getUrl(args.storageId as Id<"_storage">)) ??
        undefined;
    }
    const exportId = await ctx.db.insert("dhivehi_exports", {
      compositionId: args.compositionId,
      outputType: args.outputType,
      width: args.width,
      height: args.height,
      storageId: args.storageId,
      url,
      status: args.status,
      errorMessage: args.errorMessage,
    });

    if (args.status === "completed") {
      const comp = await ctx.db.get(args.compositionId);
      if (comp && comp.status !== "Archived") {
        await ctx.db.patch(args.compositionId, { status: "Exported" });
      }
      if (args.addToReelStudio && url && comp) {
        await ctx.db.insert("creative_exports", {
          clientId: comp.clientId,
          campaignId: comp.campaignId,
          exportType: "image",
          url,
          storageId: args.storageId,
          format: `${args.width}x${args.height}`,
          status: "completed",
          name: `${comp.title} — Reel Overlay`,
        });
      }
    }

    return { exportId, url };
  },
});
