import type { TextLayer, TextLayerType, LayerLanguage } from "./types";

// ---- Typography style presets ----
// A preset only touches visual styling, never the text content itself.

export type StylePresetKey =
  | "luxury"
  | "modern"
  | "bold_sale"
  | "corporate"
  | "traditional"
  | "youth"
  | "minimal"
  | "editorial";

export type StyleProps = Partial<
  Pick<
    TextLayer,
    | "fontWeight"
    | "letterSpacing"
    | "color"
    | "backgroundColor"
    | "backgroundOpacity"
    | "padding"
    | "borderRadius"
    | "textShadow"
    | "shadowColor"
    | "strokeWidth"
    | "strokeColor"
    | "lineHeight"
  >
>;

export interface StylePreset {
  key: StylePresetKey;
  label: string;
  props: StyleProps;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    key: "luxury",
    label: "Luxury",
    props: {
      fontWeight: "500",
      letterSpacing: 0.5,
      color: "#e8dcc0",
      backgroundColor: "transparent",
      textShadow: true,
      shadowColor: "#00000080",
      lineHeight: 1.5,
    },
  },
  {
    key: "modern",
    label: "Modern",
    props: {
      fontWeight: "600",
      letterSpacing: 0,
      color: "#ffffff",
      backgroundColor: "transparent",
      textShadow: true,
      shadowColor: "#00000066",
      lineHeight: 1.4,
    },
  },
  {
    key: "bold_sale",
    label: "Bold Sale",
    props: {
      fontWeight: "800",
      letterSpacing: 0,
      color: "#ffffff",
      backgroundColor: "#d12b2b",
      backgroundOpacity: 1,
      padding: 16,
      borderRadius: 6,
      lineHeight: 1.3,
    },
  },
  {
    key: "corporate",
    label: "Corporate",
    props: {
      fontWeight: "600",
      letterSpacing: 0,
      color: "#0f2b46",
      backgroundColor: "#ffffff",
      backgroundOpacity: 0.92,
      padding: 14,
      borderRadius: 4,
      lineHeight: 1.4,
    },
  },
  {
    key: "traditional",
    label: "Traditional",
    props: {
      fontWeight: "500",
      letterSpacing: 0,
      color: "#f5efe0",
      backgroundColor: "transparent",
      textShadow: true,
      shadowColor: "#000000aa",
      lineHeight: 1.6,
    },
  },
  {
    key: "youth",
    label: "Youth",
    props: {
      fontWeight: "700",
      letterSpacing: 0,
      color: "#111111",
      backgroundColor: "#f4d03f",
      backgroundOpacity: 1,
      padding: 12,
      borderRadius: 14,
      lineHeight: 1.3,
    },
  },
  {
    key: "minimal",
    label: "Minimal",
    props: {
      fontWeight: "400",
      letterSpacing: 0,
      color: "#ffffff",
      backgroundColor: "transparent",
      textShadow: false,
      lineHeight: 1.4,
    },
  },
  {
    key: "editorial",
    label: "Editorial",
    props: {
      fontWeight: "500",
      letterSpacing: 0,
      color: "#faf7f0",
      backgroundColor: "transparent",
      textShadow: true,
      shadowColor: "#00000059",
      lineHeight: 1.5,
    },
  },
];

// ---- Templates ----
// Positions are fractions of the canvas. Templates never carry fixed Dhivehi
// text; they define layout and placeholders only.

export interface TemplateLayerSpec {
  layerType: TextLayerType;
  language: LayerLanguage;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  fontSizePct: number; // fraction of canvas height
  align: "start" | "center" | "end";
  placeholder: string;
  preset?: StylePresetKey;
}

export interface AdTemplate {
  id: string;
  label: string;
  logoPosition: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right";
  layers: TemplateLayerSpec[];
}

const bottomStack = (preset: StylePresetKey): TemplateLayerSpec[] => [
  {
    layerType: "dv_headline",
    language: "dv",
    xPct: 0.08,
    yPct: 0.58,
    wPct: 0.84,
    hPct: 0.14,
    fontSizePct: 0.075,
    align: "end",
    placeholder: "",
    preset,
  },
  {
    layerType: "dv_subheadline",
    language: "dv",
    xPct: 0.08,
    yPct: 0.72,
    wPct: 0.84,
    hPct: 0.08,
    fontSizePct: 0.04,
    align: "end",
    placeholder: "",
    preset,
  },
  {
    layerType: "price",
    language: "neutral",
    xPct: 0.08,
    yPct: 0.82,
    wPct: 0.5,
    hPct: 0.07,
    fontSizePct: 0.05,
    align: "start",
    placeholder: "MVR 0,000",
    preset: "bold_sale",
  },
  {
    layerType: "cta",
    language: "dv",
    xPct: 0.6,
    yPct: 0.82,
    wPct: 0.32,
    hPct: 0.07,
    fontSizePct: 0.035,
    align: "center",
    placeholder: "",
    preset,
  },
];

export const TEMPLATES: AdTemplate[] = [
  { id: "restaurant_offer", label: "Restaurant Offer", logoPosition: "top-right", layers: bottomStack("bold_sale") },
  { id: "retail_sale", label: "Retail Sale", logoPosition: "top-left", layers: bottomStack("bold_sale") },
  { id: "tourism_package", label: "Tourism Package", logoPosition: "top-right", layers: bottomStack("luxury") },
  { id: "resort_promotion", label: "Resort Promotion", logoPosition: "top-right", layers: bottomStack("luxury") },
  { id: "carpentry", label: "Carpentry", logoPosition: "top-left", layers: bottomStack("corporate") },
  { id: "construction", label: "Construction", logoPosition: "top-left", layers: bottomStack("corporate") },
  { id: "real_estate", label: "Real Estate", logoPosition: "top-right", layers: bottomStack("editorial") },
  { id: "corporate_announcement", label: "Corporate Announcement", logoPosition: "top", layers: bottomStack("corporate") },
  { id: "recruitment", label: "Recruitment", logoPosition: "top-left", layers: bottomStack("modern") },
  { id: "event", label: "Event", logoPosition: "top", layers: bottomStack("editorial") },
  { id: "product_launch", label: "Product Launch", logoPosition: "top-right", layers: bottomStack("modern") },
];

export const INDUSTRIES = [
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

export const TONES = ["formal", "friendly", "urgent", "premium", "playful", "neutral"];
