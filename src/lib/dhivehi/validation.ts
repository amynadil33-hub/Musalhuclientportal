// Dhivehi text + composition validation utilities.

import { isDhivehiLayer, LTR_LAYER_TYPES } from "./constants.ts";

export type ValidationLevel = "passed" | "warning" | "error";

export type ValidationItem = {
  id: string;
  level: ValidationLevel;
  message: string;
  layerId?: string;
};

// Thaana Unicode block
const THAANA_RE = /[\u0780-\u07BF]/;
const REPLACEMENT_CHAR = "\uFFFD";
// Bidi control characters that can corrupt copy/paste
const BIDI_CONTROL_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/;

export function containsThaana(text: string): boolean {
  return THAANA_RE.test(text);
}

export function hasReplacementChar(text: string): boolean {
  return text.includes(REPLACEMENT_CHAR);
}

export function hasBidiControls(text: string): boolean {
  return BIDI_CONTROL_RE.test(text);
}

export function stripBidiControls(text: string): string {
  return text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
}

export type LayerForValidation = {
  _id: string;
  layerType: string;
  language?: string;
  text?: string;
  hidden?: boolean;
  fontFamily?: string;
  fontSize?: number;
  maxLines?: number;
  // runtime measured flags supplied by the editor
  overflow?: boolean;
  lineCount?: number;
  fontLoaded?: boolean;
  glyphSupported?: boolean;
  contrastRatio?: number;
};

export type CompositionForValidation = {
  hasBackground: boolean;
  minBodySize?: number;
  minHeadlineSize?: number;
};

const REQUIRED_TYPES = new Set(["dv_headline"]);

export function validateComposition(
  composition: CompositionForValidation,
  layers: LayerForValidation[],
): ValidationItem[] {
  const items: ValidationItem[] = [];

  if (!composition.hasBackground) {
    items.push({
      id: "no-background",
      level: "error",
      message: "No source image or background selected.",
    });
  }

  const visibleTextLayers = layers.filter(
    (l) => !l.hidden && typeof l.text === "string",
  );

  const hasRequired = layers.some((l) => REQUIRED_TYPES.has(l.layerType));
  if (!hasRequired) {
    items.push({
      id: "missing-headline",
      level: "warning",
      message: "No Dhivehi headline layer present.",
    });
  }

  for (const layer of visibleTextLayers) {
    const text = layer.text ?? "";
    const label = layer.layerType;

    if (text.trim() === "") {
      items.push({
        id: `empty-${layer._id}`,
        level: "warning",
        message: `Empty text layer (${label}).`,
        layerId: layer._id,
      });
      continue;
    }

    if (isDhivehiLayer(layer.layerType) && !containsThaana(text)) {
      items.push({
        id: `no-thaana-${layer._id}`,
        level: "error",
        message: `Dhivehi layer (${label}) contains no Thaana characters.`,
        layerId: layer._id,
      });
    }

    if (hasReplacementChar(text)) {
      items.push({
        id: `replacement-${layer._id}`,
        level: "error",
        message: `Layer (${label}) contains the Unicode replacement character \uFFFD — text may be corrupted.`,
        layerId: layer._id,
      });
    }

    if (hasBidiControls(text)) {
      items.push({
        id: `bidi-${layer._id}`,
        level: "warning",
        message: `Layer (${label}) contains invisible bidi-control characters. Review before approving.`,
        layerId: layer._id,
      });
    }

    if (layer.fontLoaded === false) {
      items.push({
        id: `font-failed-${layer._id}`,
        level: "error",
        message: `The font for layer (${label}) failed to load.`,
        layerId: layer._id,
      });
    }

    if (isDhivehiLayer(layer.layerType) && layer.glyphSupported === false) {
      items.push({
        id: `glyph-${layer._id}`,
        level: "error",
        message: `The font for layer (${label}) does not support Thaana glyphs.`,
        layerId: layer._id,
      });
    }

    if (layer.overflow) {
      items.push({
        id: `overflow-${layer._id}`,
        level: "error",
        message: `Text in layer (${label}) overflows its box.`,
        layerId: layer._id,
      });
    }

    if (
      layer.maxLines &&
      layer.lineCount &&
      layer.lineCount > layer.maxLines
    ) {
      items.push({
        id: `maxlines-${layer._id}`,
        level: "warning",
        message: `Layer (${label}) exceeds its maximum of ${layer.maxLines} lines.`,
        layerId: layer._id,
      });
    }

    const minSize = layer.layerType.includes("headline")
      ? composition.minHeadlineSize
      : composition.minBodySize;
    if (minSize && layer.fontSize && layer.fontSize < minSize) {
      items.push({
        id: `minsize-${layer._id}`,
        level: "warning",
        message: `Layer (${label}) font size is below the configured minimum (${minSize}px).`,
        layerId: layer._id,
      });
    }

    if (
      typeof layer.contrastRatio === "number" &&
      layer.contrastRatio < 3
    ) {
      items.push({
        id: `contrast-${layer._id}`,
        level: "warning",
        message: `Layer (${label}) has low contrast against its background.`,
        layerId: layer._id,
      });
    }
  }

  return items;
}

// Serious errors that must block export.
const BLOCKING_IDS = /^(no-background|no-thaana|replacement|font-failed|glyph|overflow)/;

export function getBlockingErrors(
  items: ValidationItem[],
): ValidationItem[] {
  return items.filter(
    (i) => i.level === "error" && BLOCKING_IDS.test(i.id),
  );
}

// Relative luminance + contrast ratio (WCAG) for a pair of hex colours.
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const full =
    c.length === 3
      ? c
          .split("")
          .map((x) => x + x)
          .join("")
      : c;
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(fg: string, bg: string): number {
  try {
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  } catch {
    return 21;
  }
}

export { LTR_LAYER_TYPES };
