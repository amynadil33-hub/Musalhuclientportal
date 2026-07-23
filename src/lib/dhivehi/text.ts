// Text fitting + RTL helpers for the Dhivehi Composer.

import { isDhivehiLayer, LTR_LAYER_TYPES } from "./constants.ts";

export function resolveDirection(
  layerType: string,
  explicit?: string,
): "rtl" | "ltr" {
  if (explicit === "rtl" || explicit === "ltr") return explicit;
  if (isDhivehiLayer(layerType)) return "rtl";
  return "ltr";
}

export function resolveLang(layerType: string): string {
  if (isDhivehiLayer(layerType)) return "dv";
  return "en";
}

export function isLtrContentLayer(layerType: string): boolean {
  return LTR_LAYER_TYPES.has(layerType);
}

/**
 * Splits text into segments, isolating runs of LTR content (numbers, latin,
 * urls, phone, prices) so they can be wrapped in <bdi dir="ltr">. This keeps
 * prices and phone numbers correctly ordered inside RTL Dhivehi text without
 * ever reversing characters manually.
 */
const LTR_RUN_RE =
  /((?:https?:\/\/)?[A-Za-z0-9@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]+(?:\s+[A-Za-z0-9@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]+)*|\+?\d[\d\s,./-]*\d|\d)/g;

export type TextSegment = { text: string; ltr: boolean };

export function segmentBidi(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  LTR_RUN_RE.lastIndex = 0;
  while ((match = LTR_RUN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), ltr: false });
    }
    segments.push({ text: match[0], ltr: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), ltr: false });
  }
  return segments;
}

/**
 * Measures a text block against a box using a hidden DOM node and reduces the
 * font size (never below `minSize`) until it fits. Never distorts glyph width.
 */
export function fitFontSize(params: {
  text: string;
  fontFamily: string;
  fontWeight: string;
  startSize: number;
  minSize: number;
  boxWidth: number;
  boxHeight: number;
  lineHeight: number;
  letterSpacing: number;
  direction: "rtl" | "ltr";
}): { fontSize: number; fits: boolean; lineCount: number } {
  if (typeof document === "undefined") {
    return { fontSize: params.startSize, fits: true, lineCount: 1 };
  }
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.left = "-99999px";
  el.style.top = "0";
  el.style.width = `${params.boxWidth}px`;
  el.style.fontFamily = params.fontFamily;
  el.style.fontWeight = params.fontWeight;
  el.style.lineHeight = String(params.lineHeight);
  el.style.letterSpacing = `${params.letterSpacing}px`;
  el.style.whiteSpace = "pre-wrap";
  el.style.wordBreak = "break-word";
  el.style.direction = params.direction;
  el.textContent = params.text || " ";
  document.body.appendChild(el);

  let size = params.startSize;
  let fits = false;
  let lineCount = 1;
  while (size >= params.minSize) {
    el.style.fontSize = `${size}px`;
    const fitsHeight = el.scrollHeight <= params.boxHeight + 1;
    const fitsWidth = el.scrollWidth <= params.boxWidth + 1;
    if (fitsHeight && fitsWidth) {
      fits = true;
      const lh = size * params.lineHeight;
      lineCount = Math.max(1, Math.round(el.scrollHeight / lh));
      break;
    }
    size -= 1;
  }
  if (!fits) {
    el.style.fontSize = `${params.minSize}px`;
    const lh = params.minSize * params.lineHeight;
    lineCount = Math.max(1, Math.round(el.scrollHeight / lh));
    size = params.minSize;
  }
  document.body.removeChild(el);
  return { fontSize: size, fits, lineCount };
}
