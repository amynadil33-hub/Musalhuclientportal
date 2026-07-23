import type { AdTemplate } from "./templates.ts";
import { STYLE_PRESETS, TEXT_LAYER_TYPES, isDhivehiLayer } from "./constants.ts";

export type NewLayerArgs = {
  layerType: string;
  language?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  direction?: string;
  autoFit?: boolean;
  textColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number;
  borderRadius?: number;
  textShadow?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  reviewStatus?: string;
};

/**
 * Converts a template's fractional layout into concrete layer creation args
 * for a canvas of the given pixel dimensions. Text is placeholder only.
 */
export function applyTemplate(
  template: AdTemplate,
  canvasWidth: number,
  canvasHeight: number,
): NewLayerArgs[] {
  return template.layers.map((tl) => {
    const preset = tl.presetId
      ? STYLE_PRESETS.find((p) => p.id === tl.presetId)
      : undefined;
    const typeDef = TEXT_LAYER_TYPES.find((t) => t.id === tl.layerType);
    const dv = isDhivehiLayer(tl.layerType);
    return {
      layerType: tl.layerType,
      language: tl.language ?? (dv ? "dv" : "neutral"),
      text: tl.placeholder,
      x: Math.round(tl.xPct * canvasWidth),
      y: Math.round(tl.yPct * canvasHeight),
      width: Math.round(tl.widthPct * canvasWidth),
      height: Math.round(tl.heightPct * canvasHeight),
      fontSize: Math.round(tl.fontSizePct * canvasHeight),
      fontWeight: preset?.fontWeight ?? typeDef?.defaultWeight ?? "500",
      lineHeight: preset?.lineHeight ?? 1.3,
      letterSpacing: preset?.letterSpacing ?? 0,
      textAlign: tl.align ?? (dv ? "right" : "left"),
      direction: dv ? "rtl" : "ltr",
      autoFit: true,
      textColor: preset?.textColor ?? "#ffffff",
      backgroundColor: preset?.backgroundColor,
      backgroundOpacity: preset?.backgroundOpacity,
      padding: preset?.padding,
      borderRadius: preset?.borderRadius,
      textShadow: preset?.textShadow ?? true,
      strokeColor: preset?.strokeColor,
      strokeWidth: preset?.strokeWidth,
      reviewStatus: "AI Draft",
    };
  });
}
