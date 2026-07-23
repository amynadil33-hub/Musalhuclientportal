// Shared constants for the Dhivehi Ad Composer

export const THAANA_FALLBACK_STACK =
  '"Noto Sans Thaana", "MV Boli", "MV Faseyha", sans-serif';

export type OutputFormat = {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
  safeArea: "none" | "social" | "story_reel";
};

export const OUTPUT_FORMATS: OutputFormat[] = [
  {
    id: "ig_portrait",
    label: "Instagram Portrait",
    width: 1080,
    height: 1350,
    ratio: "4:5",
    safeArea: "social",
  },
  {
    id: "ig_square",
    label: "Instagram Square",
    width: 1080,
    height: 1080,
    ratio: "1:1",
    safeArea: "social",
  },
  {
    id: "story_reel",
    label: "Story & Reel",
    width: 1080,
    height: 1920,
    ratio: "9:16",
    safeArea: "story_reel",
  },
  {
    id: "fb_landscape",
    label: "Facebook Landscape",
    width: 1200,
    height: 628,
    ratio: "1.91:1",
    safeArea: "social",
  },
  {
    id: "landscape_video",
    label: "Landscape Video Cover",
    width: 1920,
    height: 1080,
    ratio: "16:9",
    safeArea: "social",
  },
  {
    id: "custom",
    label: "Custom size",
    width: 1080,
    height: 1080,
    ratio: "custom",
    safeArea: "none",
  },
];

export type LayerTypeDef = {
  id: string;
  label: string;
  language: "dv" | "en" | "neutral";
  defaultFontSize: number;
  defaultWeight: string;
};

export const TEXT_LAYER_TYPES: LayerTypeDef[] = [
  { id: "dv_headline", label: "Dhivehi Headline", language: "dv", defaultFontSize: 72, defaultWeight: "700" },
  { id: "dv_subheadline", label: "Dhivehi Subheadline", language: "dv", defaultFontSize: 48, defaultWeight: "600" },
  { id: "dv_body", label: "Dhivehi Body", language: "dv", defaultFontSize: 32, defaultWeight: "400" },
  { id: "en_headline", label: "English Headline", language: "en", defaultFontSize: 64, defaultWeight: "700" },
  { id: "en_subheadline", label: "English Subheadline", language: "en", defaultFontSize: 44, defaultWeight: "600" },
  { id: "en_body", label: "English Body", language: "en", defaultFontSize: 30, defaultWeight: "400" },
  { id: "offer", label: "Offer", language: "neutral", defaultFontSize: 48, defaultWeight: "700" },
  { id: "price", label: "Price", language: "neutral", defaultFontSize: 56, defaultWeight: "700" },
  { id: "cta", label: "CTA", language: "neutral", defaultFontSize: 36, defaultWeight: "700" },
  { id: "phone", label: "Phone Number", language: "neutral", defaultFontSize: 34, defaultWeight: "600" },
  { id: "website", label: "Website", language: "neutral", defaultFontSize: 30, defaultWeight: "500" },
  { id: "date", label: "Date", language: "neutral", defaultFontSize: 30, defaultWeight: "500" },
  { id: "location", label: "Location", language: "neutral", defaultFontSize: 30, defaultWeight: "500" },
  { id: "disclaimer", label: "Disclaimer", language: "neutral", defaultFontSize: 20, defaultWeight: "400" },
  { id: "custom_text", label: "Custom Text", language: "neutral", defaultFontSize: 36, defaultWeight: "500" },
];

export const isDhivehiLayer = (layerType: string) =>
  layerType.startsWith("dv_");

// Layer types where the content is inherently left-to-right (numbers/latin)
export const LTR_LAYER_TYPES = new Set([
  "price",
  "phone",
  "website",
  "date",
]);

export const FONT_SUPPORTED_USES = [
  "headline",
  "subheadline",
  "body",
  "price",
  "CTA",
  "traditional",
  "corporate",
  "luxury",
  "bold sale",
  "youth",
  "minimal",
];

export const PHRASE_CATEGORIES = [
  "CTA",
  "promotion",
  "new arrival",
  "limited offer",
  "booking",
  "enquiry",
  "restaurant",
  "tourism",
  "carpentry",
  "construction",
  "retail",
  "real estate",
  "education",
  "event",
  "recruitment",
  "corporate",
];

export const REVIEW_STATUSES = [
  "AI Draft",
  "Needs Review",
  "Reviewed",
  "Approved",
  "Locked",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const COMPOSITION_STATUSES = [
  "Draft",
  "Needs Review",
  "Approved",
  "Exported",
  "Archived",
] as const;

// Typography style presets. These control style only, never text content.
export type StylePreset = {
  id: string;
  label: string;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
  textColor: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number;
  borderRadius?: number;
  textShadow?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
};

export const STYLE_PRESETS: StylePreset[] = [
  { id: "luxury", label: "Luxury", fontWeight: "500", letterSpacing: 1, lineHeight: 1.3, textColor: "#f0e6cf", textShadow: true },
  { id: "modern", label: "Modern", fontWeight: "600", letterSpacing: 0, lineHeight: 1.25, textColor: "#ffffff" },
  { id: "bold_sale", label: "Bold Sale", fontWeight: "800", letterSpacing: 0, lineHeight: 1.1, textColor: "#ffffff", backgroundColor: "#c0392b", backgroundOpacity: 1, padding: 16, borderRadius: 8 },
  { id: "corporate", label: "Corporate", fontWeight: "600", letterSpacing: 0, lineHeight: 1.35, textColor: "#0f1c2e" },
  { id: "traditional", label: "Traditional", fontWeight: "500", letterSpacing: 0, lineHeight: 1.4, textColor: "#f4ecd8" },
  { id: "youth", label: "Youth", fontWeight: "700", letterSpacing: 0, lineHeight: 1.15, textColor: "#ffffff", strokeColor: "#000000", strokeWidth: 2 },
  { id: "minimal", label: "Minimal", fontWeight: "400", letterSpacing: 0, lineHeight: 1.4, textColor: "#111111" },
  { id: "editorial", label: "Editorial", fontWeight: "500", letterSpacing: 0, lineHeight: 1.5, textColor: "#1a1a1a" },
];

// Text-safe area choices for AI image generation
export const TEXT_SAFE_AREAS = [
  { id: "top", label: "Top" },
  { id: "upper_right", label: "Upper right" },
  { id: "upper_left", label: "Upper left" },
  { id: "centre", label: "Centre" },
  { id: "lower_right", label: "Lower right" },
  { id: "lower_left", label: "Lower left" },
  { id: "custom", label: "Custom" },
];

export const AI_CLEAN_SPACE_INSTRUCTION =
  "Create only the visual artwork. Leave appropriate clean space for advertising text. Do not include letters, words, numbers, prices, logos, labels, signage, watermarks, UI elements or typography anywhere in the image.";
