import { v } from "convex/values";

export const referenceRole = v.union(
  v.literal("brand"),
  v.literal("logo"),
  v.literal("product"),
  v.literal("service"),
  v.literal("environment"),
  v.literal("character"),
  v.literal("style"),
  v.literal("moodboard"),
  v.literal("campaignAnchor"),
  v.literal("approvedAd"),
  v.literal("sceneReference"),
  v.literal("frameReference"),
);

export const referenceStrength = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

export const selectedReferenceImage = v.object({
  sourceType: v.string(),
  sourceId: v.optional(v.string()),
  storageId: v.optional(v.string()),
  url: v.optional(v.string()),
  label: v.optional(v.string()),
  role: referenceRole,
  strength: referenceStrength,
  isPrimary: v.optional(v.boolean()),
  notes: v.optional(v.string()),
  sortOrder: v.number(),
});

export type ReferenceValue = {
  sourceType: string;
  sourceId?: string;
  storageId?: string;
  url?: string;
  label?: string;
  role:
    | "brand"
    | "logo"
    | "product"
    | "service"
    | "environment"
    | "character"
    | "style"
    | "moodboard"
    | "campaignAnchor"
    | "approvedAd"
    | "sceneReference"
    | "frameReference";
  strength: "low" | "medium" | "high";
  isPrimary?: boolean;
  notes?: string;
  sortOrder: number;
};

const roleDirections: Record<ReferenceValue["role"], string> = {
  brand: "preserve the brand's recognizable visual identity",
  logo: "preserve the logo exactly; do not redraw or alter its proportions",
  product: "preserve the product's appearance, materials, colours, and construction details",
  service: "represent the referenced service accurately",
  environment: "preserve or closely echo the location and setting",
  character: "preserve the character or mascot's identity and appearance",
  style: "borrow only the lighting, mood, composition, and colour treatment",
  moodboard: "use the visual themes as broad inspiration",
  campaignAnchor: "preserve the campaign's overall visual identity and art direction",
  approvedAd: "maintain continuity with this previously approved advertisement",
  sceneReference: "use this as the scene's principal visual source",
  frameReference: "maintain visual continuity with this frame",
};

export function composeReferenceInstructions(references: ReferenceValue[] | undefined) {
  if (!references?.length) return "";
  return [...references]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((reference, index) => {
      const strength =
        reference.strength === "high"
          ? "Strongly"
          : reference.strength === "medium"
            ? "Closely"
            : "Use as inspiration to";
      const primary = reference.isPrimary ? " This is the primary visual reference." : "";
      const notes = reference.notes ? ` Note: ${reference.notes}` : "";
      return `Reference ${index + 1} (${reference.role}): ${strength} ${roleDirections[reference.role]}.${primary}${notes}`;
    })
    .join("\n");
}
