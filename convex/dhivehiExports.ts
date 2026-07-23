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

export const listByComposition = query({
  args: { compositionId: v.id("dhivehi_compositions") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db
      .query("dhivehi_exports")
      .withIndex("by_composition", (q) =>
        q.eq("compositionId", args.compositionId),
      )
      .order("desc")
      .collect();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const record = mutation({
  args: {
    compositionId: v.id("dhivehi_compositions"),
    outputType: v.string(),
    width: v.number(),
    height: v.number(),
    storageId: v.optional(v.string()),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    let url: string | null = null;
    if (args.storageId) {
      url = await ctx.storage.getUrl(args.storageId);
    }

    const exportId = await ctx.db.insert("dhivehi_exports", {
      ...args,
      url: url ?? undefined,
      createdBy: identity.name ?? identity.email,
    });

    // Mark composition as Exported (retain prior status implicitly via versioning)
    if (args.status === "completed") {
      const composition = await ctx.db.get(args.compositionId);
      if (composition && composition.status !== "Archived") {
        await ctx.db.patch(args.compositionId, { status: "Exported" });
      }

      // Make reel overlays available in Reel Studio via creative_exports
      if (args.outputType === "reel_overlay" && composition && url) {
        await ctx.db.insert("creative_exports", {
          clientId: composition.clientId,
          campaignId: composition.campaignId,
          exportType: "reel",
          url,
          storageId: args.storageId,
          format: "9:16 overlay",
          status: "completed",
          name: `${composition.title} — Reel Overlay`,
        });
      }
    }

    return { exportId, url };
  },
});
