export const REFERENCE_ROLES = [
  "brand",
  "logo",
  "product",
  "service",
  "environment",
  "character",
  "style",
  "moodboard",
  "campaignAnchor",
  "approvedAd",
  "sceneReference",
  "frameReference",
] as const;

export type ReferenceRole = (typeof REFERENCE_ROLES)[number];
export type ReferenceStrength = "low" | "medium" | "high";

export interface SelectedReferenceImage {
  sourceType: string;
  sourceId?: string;
  storageId?: string;
  url?: string;
  label?: string;
  role: ReferenceRole;
  strength: ReferenceStrength;
  isPrimary?: boolean;
  notes?: string;
  sortOrder: number;
}

export const ROLE_LABELS: Record<ReferenceRole, string> = {
  brand: "Brand",
  logo: "Logo",
  product: "Product",
  service: "Service",
  environment: "Environment",
  character: "Character",
  style: "Style",
  moodboard: "Moodboard",
  campaignAnchor: "Campaign anchor",
  approvedAd: "Approved ad",
  sceneReference: "Scene reference",
  frameReference: "Frame reference",
};

export const STRENGTH_LABELS: Record<ReferenceStrength, string> = {
  low: "Inspiration only",
  medium: "Medium guidance",
  high: "Strong preservation",
};

export function normalizeReferences(references: SelectedReferenceImage[]) {
  const trimmed = references.slice(0, 8);
  const primaryIndex = trimmed.findIndex((reference) => reference.isPrimary);
  return trimmed.map((reference, index) => ({
    ...reference,
    isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
    sortOrder: index,
  }));
}
