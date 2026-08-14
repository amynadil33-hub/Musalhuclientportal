import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { selectedReferenceImage } from "./referenceImageValues";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) {
    throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
  }
}

export const library = query({
  args: {
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const assets = await ctx.db
      .query("brand_assets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const generations = await ctx.db
      .query("image_generations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(50);
    const anchors = args.campaignId
      ? await ctx.db
          .query("campaign_anchors")
          .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
          .collect()
      : [];
    const reels = await ctx.db
      .query("reel_projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const scenes = (await Promise.all(
      reels.map((reel) =>
        ctx.db
          .query("reel_scenes")
          .withIndex("by_reel_project", (q) => q.eq("reelProjectId", reel._id))
          .collect(),
      ),
    )).flat();

    return [
      ...assets.map((asset) => ({
        key: `asset:${asset._id}`,
        sourceType: "brandAsset",
        sourceId: String(asset._id),
        storageId: asset.storageId,
        url: asset.url,
        label: asset.name ?? asset.assetType.replaceAll("_", " "),
        group: asset.assetType === "mood_board" ? "Moodboards" : "Brand assets",
        suggestedRole:
          asset.assetType === "logo" ? "logo" :
          asset.assetType === "product_photo" ? "product" :
          asset.assetType === "business_photo" ? "environment" :
          asset.assetType === "mood_board" ? "moodboard" : "brand",
      })),
      ...anchors.map((anchor) => ({
        key: `anchor:${anchor._id}`,
        sourceType: "campaignAnchor",
        sourceId: String(anchor._id),
        storageId: anchor.storageId,
        url: anchor.imageUrl,
        label: anchor.name ?? `${anchor.anchorType} anchor`,
        group: "Campaign anchors",
        suggestedRole: "campaignAnchor",
      })),
      ...generations.flatMap((generation) =>
        (generation.imageUrls ?? []).map((url, index) => ({
          key: `generation:${generation._id}:${index}`,
          sourceType: "imageGeneration",
          sourceId: String(generation._id),
          storageId: generation.storageIds?.[index],
          url,
          label: generation.shortPrompt || `Generated image ${index + 1}`,
          group: generation.approvalStatus === "approved" ? "Approved ads" : "Generated images",
          suggestedRole: generation.approvalStatus === "approved" ? "approvedAd" : "style",
        })),
      ),
      ...scenes.flatMap((scene) => {
        const url = scene.referenceImages?.find((reference) => reference.isPrimary)?.url ?? scene.referenceImageUrl;
        return url ? [{
          key: `scene:${scene._id}`,
          sourceType: "reelScene",
          sourceId: String(scene._id),
          url,
          label: `Scene ${scene.sceneNumber} frame`,
          group: "Reel scene frames",
          suggestedRole: "frameReference",
        }] : [];
      }),
    ];
  },
});

export const listSets = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db
      .query("reference_image_sets")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();
  },
});

export const saveSet = mutation({
  args: {
    clientId: v.id("clients"),
    campaignId: v.id("campaigns"),
    title: v.string(),
    notes: v.optional(v.string()),
    referenceImages: v.array(selectedReferenceImage),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    if (!args.title.trim()) throw new ConvexError("Reference set title is required");
    if (!args.referenceImages.length) throw new ConvexError("Select at least one reference");
    return ctx.db.insert("reference_image_sets", { ...args, title: args.title.trim() });
  },
});

export const removeSet = mutation({
  args: { setId: v.id("reference_image_sets") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.setId);
  },
});
