// Shared types for the Dhivehi Ad Composer.

export type LayerKind = "text" | "logo" | "image" | "shape";

export type TextLayerType =
  | "dv_headline"
  | "dv_subheadline"
  | "dv_body"
  | "en_headline"
  | "en_subheadline"
  | "en_body"
  | "offer"
  | "price"
  | "cta"
  | "phone"
  | "website"
  | "date"
  | "location"
  | "disclaimer"
  | "custom";

export type LayerLanguage = "dv" | "en" | "neutral";

export type ReviewStatus =
  | "AI Draft"
  | "Needs Review"
  | "Reviewed"
  | "Approved"
  | "Locked";

export type ShapeKind = "rectangle" | "ellipse" | "line";

export interface BaseLayer {
  id: string;
  kind: LayerKind;
  name: string;
  x: number; // px in canvas coordinate space
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  // Future reel animation preparation (not rendered yet)
  startTime?: number;
  endTime?: number;
  entranceAnimation?: string;
  exitAnimation?: string;
}

export interface TextLayer extends BaseLayer {
  kind: "text";
  layerType: TextLayerType;
  language: LayerLanguage;
  text: string;
  fontId?: string; // dhivehi_fonts _id for Dhivehi fonts
  fontFamily: string; // CSS family name actually applied
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: "start" | "center" | "end";
  direction: "rtl" | "ltr";
  color: string;
  backgroundColor: string; // "transparent" or hex/oklch
  backgroundOpacity: number;
  padding: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  textShadow: boolean;
  shadowColor: string;
  strokeWidth: number;
  strokeColor: string;
  maxLines?: number;
  autoFit: boolean;
  minFontSize: number;
  reviewStatus: ReviewStatus;
  reviewerName?: string;
  reviewedAt?: number;
}

export interface LogoLayer extends BaseLayer {
  kind: "logo";
  src: string;
  storageId?: string;
  variant?: "full" | "white" | "dark";
  safeMargin: number;
}

export interface ImageLayer extends BaseLayer {
  kind: "image";
  src: string;
  storageId?: string;
}

export interface ShapeLayer extends BaseLayer {
  kind: "shape";
  shape: ShapeKind;
  fill: string;
  fillOpacity: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
}

export type Layer = TextLayer | LogoLayer | ImageLayer | ShapeLayer;

export function isTextLayer(l: Layer): l is TextLayer {
  return l.kind === "text";
}
export function isLogoLayer(l: Layer): l is LogoLayer {
  return l.kind === "logo";
}
export function isImageLayer(l: Layer): l is ImageLayer {
  return l.kind === "image";
}
export function isShapeLayer(l: Layer): l is ShapeLayer {
  return l.kind === "shape";
}

export const TEXT_LAYER_LABELS: Record<TextLayerType, string> = {
  dv_headline: "Dhivehi Headline",
  dv_subheadline: "Dhivehi Subheadline",
  dv_body: "Dhivehi Body",
  en_headline: "English Headline",
  en_subheadline: "English Subheadline",
  en_body: "English Body",
  offer: "Offer",
  price: "Price",
  cta: "Call to Action",
  phone: "Phone Number",
  website: "Website",
  date: "Date",
  location: "Location",
  disclaimer: "Disclaimer",
  custom: "Custom Text",
};

export const REVIEW_STATUSES: ReviewStatus[] = [
  "AI Draft",
  "Needs Review",
  "Reviewed",
  "Approved",
  "Locked",
];

export const COMPOSITION_STATUSES = [
  "Draft",
  "Needs Review",
  "Approved",
  "Exported",
  "Archived",
] as const;
export type CompositionStatus = (typeof COMPOSITION_STATUSES)[number];
