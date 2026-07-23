import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("owner"), v.literal("member"))),
    approvalStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_approval_status", ["approvalStatus"]),

  clients: defineTable({
    name: v.string(),
    industry: v.string(),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.string()),
    isArchived: v.boolean(),
    createdBy: v.optional(v.string()),
  }).index("by_archived", ["isArchived"]),

  brand_profiles: defineTable({
    clientId: v.id("clients"),
    // basic info
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
    // brand
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
    // Dhivehi Composer typography defaults (optional)
    dvHeadlineFontId: v.optional(v.id("dhivehi_fonts")),
    dvSubheadlineFontId: v.optional(v.id("dhivehi_fonts")),
    dvBodyFontId: v.optional(v.id("dhivehi_fonts")),
    dvPriceFontId: v.optional(v.id("dhivehi_fonts")),
    dvCtaFontId: v.optional(v.id("dhivehi_fonts")),
    enHeadlineFont: v.optional(v.string()),
    enBodyFont: v.optional(v.string()),
    minHeadlineSize: v.optional(v.number()),
    minBodySize: v.optional(v.number()),
    headlineLineHeight: v.optional(v.number()),
    maxHeadlineLines: v.optional(v.number()),
  }).index("by_client", ["clientId"]),

  target_audiences: defineTable({
    clientId: v.id("clients"),
    location: v.optional(v.string()),
    ageGroup: v.optional(v.string()),
    customerType: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    buyerMotivations: v.optional(v.array(v.string())),
    painPoints: v.optional(v.array(v.string())),
    preferredLanguage: v.optional(v.string()),
    culturalConsiderations: v.optional(v.string()),
    campaignPlatforms: v.optional(v.array(v.string())),
  }).index("by_client", ["clientId"]),

  products_services: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    price: v.optional(v.string()),
    promotionalPrice: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    cta: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_client", ["clientId"]),

  brand_assets: defineTable({
    clientId: v.id("clients"),
    assetType: v.string(), // logo | product_photo | business_photo | old_ad | mood_board | visual_ref | approved_gen | video_clip
    url: v.string(),
    storageId: v.optional(v.string()),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_client", ["clientId"])
    .index("by_client_type", ["clientId", "assetType"]),

  campaigns: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    objective: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    mainMessage: v.optional(v.string()),
    slogan: v.optional(v.string()),
    offer: v.optional(v.string()),
    cta: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    visualDirection: v.optional(v.string()),
    mood: v.optional(v.string()),
    colourTreatment: v.optional(v.string()),
    photographyStyle: v.optional(v.string()),
    videoMotionStyle: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.string(), // Draft | Active | Completed | Archived
    selectedProductIds: v.optional(v.array(v.id("products_services"))),
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  campaign_memory: defineTable({
    campaignId: v.id("campaigns"),
    masterPrompt: v.optional(v.string()),
    visualDirection: v.optional(v.string()),
    negativeInstructions: v.optional(v.string()),
    preferredLighting: v.optional(v.string()),
    preferredColors: v.optional(v.array(v.string())),
    materials: v.optional(v.array(v.string())),
    environment: v.optional(v.string()),
    cameraStyle: v.optional(v.string()),
    slogans: v.optional(v.array(v.string())),
    previousPrompts: v.optional(v.array(v.string())),
    teamNotes: v.optional(v.string()),
  }).index("by_campaign", ["campaignId"]),

  campaign_anchors: defineTable({
    campaignId: v.id("campaigns"),
    imageUrl: v.string(),
    storageId: v.optional(v.string()),
    anchorType: v.string(), // primary | style | product | environment | character
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
    generationId: v.optional(v.id("image_generations")),
  }).index("by_campaign", ["campaignId"]),

  image_generations: defineTable({
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    productId: v.optional(v.id("products_services")),
    shortPrompt: v.string(),
    fullPrompt: v.string(),
    platform: v.optional(v.string()),
    format: v.optional(v.string()),
    quality: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    storageIds: v.optional(v.array(v.string())),
    provider: v.optional(v.string()),
    status: v.string(), // pending | completed | failed
    isAnchor: v.optional(v.boolean()),
    estimatedCost: v.optional(v.number()),
    anchorType: v.optional(v.string()),
  })
    .index("by_client", ["clientId"])
    .index("by_campaign", ["campaignId"]),

  reel_projects: defineTable({
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    name: v.string(),
    objective: v.optional(v.string()),
    status: v.string(), // draft | in_progress | completed
    format: v.optional(v.string()), // 9:16 | 1:1 | 16:9
  })
    .index("by_client", ["clientId"])
    .index("by_campaign", ["campaignId"]),

  reel_scenes: defineTable({
    reelProjectId: v.id("reel_projects"),
    sceneNumber: v.number(),
    description: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
    motionPrompt: v.optional(v.string()),
    cameraMovement: v.optional(v.string()),
    duration: v.optional(v.number()),
    onScreenText: v.optional(v.string()),
    transition: v.optional(v.string()),
    videoProvider: v.optional(v.string()),
    generationStatus: v.optional(v.string()),
    generatedClipUrl: v.optional(v.string()),
    videoJobId: v.optional(v.id("video_jobs")),
  }).index("by_reel_project", ["reelProjectId"]),

  video_jobs: defineTable({
    reelSceneId: v.optional(v.id("reel_scenes")),
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    provider: v.string(),
    providerJobId: v.optional(v.string()),
    status: v.string(), // queued | processing | completed | failed
    inputImageUrl: v.optional(v.string()),
    motionPrompt: v.optional(v.string()),
    outputUrl: v.optional(v.string()),
    storageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    estimatedCost: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_client", ["clientId"]),

  creative_exports: defineTable({
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    reelProjectId: v.optional(v.id("reel_projects")),
    exportType: v.string(), // image | video | reel
    url: v.string(),
    storageId: v.optional(v.string()),
    format: v.optional(v.string()),
    status: v.string(),
    name: v.optional(v.string()),
  }).index("by_client", ["clientId"]),

  text_layers: defineTable({
    generationId: v.optional(v.id("image_generations")),
    exportId: v.optional(v.id("creative_exports")),
    layerType: v.string(), // logo | headline_en | headline_dv | price | promo | phone | website | cta | date | disclaimer
    content: v.string(),
    x: v.number(),
    y: v.number(),
    width: v.optional(v.number()),
    fontSize: v.number(),
    fontWeight: v.optional(v.string()),
    textAlign: v.optional(v.string()),
    color: v.string(),
    opacity: v.optional(v.number()),
    zIndex: v.optional(v.number()),
    isRTL: v.optional(v.boolean()),
    fontFamily: v.optional(v.string()),
  }).index("by_generation", ["generationId"]),

  usage_records: defineTable({
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("campaigns")),
    type: v.string(), // image | video
    provider: v.string(),
    quality: v.optional(v.string()),
    durationSecs: v.optional(v.number()),
    numOutputs: v.optional(v.number()),
    estimatedCost: v.optional(v.number()),
    success: v.boolean(),
    date: v.string(),
  })
    .index("by_client", ["clientId"])
    .index("by_date", ["date"]),

  app_settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  // ---------------------------------------------------------------------------
  // DHIVEHI AD COMPOSER
  // ---------------------------------------------------------------------------

  dhivehi_fonts: defineTable({
    displayName: v.string(),
    cssFamily: v.string(),
    storageId: v.optional(v.string()),
    fontUrl: v.optional(v.string()),
    fileFormat: v.string(), // woff2 | woff | ttf | otf
    fontWeight: v.optional(v.string()),
    fontStyle: v.optional(v.string()),
    isVariable: v.optional(v.boolean()),
    minWeight: v.optional(v.number()),
    maxWeight: v.optional(v.number()),
    supportedUses: v.optional(v.array(v.string())),
    licenceName: v.optional(v.string()),
    licenceNotes: v.optional(v.string()),
    commercialUseConfirmed: v.optional(v.boolean()),
    // pending | supported | partial | failed | unavailable
    glyphValidationStatus: v.string(),
    active: v.boolean(),
    createdBy: v.optional(v.string()),
  }).index("by_active", ["active"]),

  dhivehi_compositions: defineTable({
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
    // Layers embedded as an array so the whole composition saves atomically
    // (debounced from the editor) and reloads in a single query.
    layers: v.array(v.any()),
    // Draft | Needs Review | Approved | Exported | Archived
    status: v.string(),
    createdBy: v.optional(v.string()),
  })
    .index("by_client", ["clientId"])
    .index("by_campaign", ["campaignId"]),

  dhivehi_phrases: defineTable({
    englishMeaning: v.string(),
    dhivehiText: v.string(),
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    tone: v.optional(v.string()),
    notes: v.optional(v.string()),
    usageCount: v.optional(v.number()),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  dhivehi_exports: defineTable({
    compositionId: v.id("dhivehi_compositions"),
    outputType: v.string(), // png | jpeg | overlay
    width: v.number(),
    height: v.number(),
    storageId: v.optional(v.string()),
    url: v.optional(v.string()),
    status: v.string(), // completed | failed
    errorMessage: v.optional(v.string()),
  }).index("by_composition", ["compositionId"]),
});
