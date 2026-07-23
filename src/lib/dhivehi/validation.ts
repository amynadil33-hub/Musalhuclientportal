import type { Layer, TextLayer } from "./types";
import { isTextLayer } from "./types";

export type ValidationLevel = "passed" | "warning" | "error";

export interface ValidationIssue {
  level: ValidationLevel;
  code: string;
  message: string;
  layerId?: string;
}

// U+0780–U+07BF Thaana block
const THAANA_RE = /[\u0780-\u07BF]/;
const REPLACEMENT_CHAR = "\uFFFD";
// Bidi overrides/embeddings that can silently corrupt saved text order.
const SUSPICIOUS_BIDI_RE = /[\u202A-\u202E\u2066-\u2069]/;

export function containsThaana(text: string): boolean {
  return THAANA_RE.test(text);
}

export function hasReplacementChar(text: string): boolean {
  return text.includes(REPLACEMENT_CHAR);
}

export function hasSuspiciousBidi(text: string): boolean {
  return SUSPICIOUS_BIDI_RE.test(text);
}

export function stripSuspiciousBidi(text: string): string {
  return text.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
}

// ---- Contrast (WCAG relative luminance) ----

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const s = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

export function contrastRatio(fg: string, bg: string): number | null {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return null;
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ValidateInput {
  layers: Layer[];
  hasBackground: boolean;
  backgroundColor?: string; // solid bg color if applicable
  // Runtime signals gathered from the editor DOM
  overflow: Record<string, boolean>;
  lineCount: Record<string, number>;
  fontLoaded: Record<string, boolean>; // fontId or family -> loaded
}

// Errors serious enough to block export.
export const BLOCKING_CODES = new Set([
  "missing_glyph_font",
  "font_failed",
  "encoding_corrupted",
  "overflow",
  "missing_source",
]);

export function validateComposition(input: ValidateInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { layers } = input;

  if (!input.hasBackground) {
    issues.push({
      level: "error",
      code: "missing_source",
      message: "No source image or background is set for this composition.",
    });
  }

  const textLayers = layers.filter(
    (l) => isTextLayer(l) && !l.hidden,
  ) as TextLayer[];

  for (const layer of textLayers) {
    const text = layer.text ?? "";

    // 11. Empty required layers
    if (!text.trim()) {
      issues.push({
        level: "warning",
        code: "empty",
        message: `${layer.name} is empty.`,
        layerId: layer.id,
      });
      continue;
    }

    // 1. Thaana present when language is Dhivehi
    if (layer.language === "dv" && !containsThaana(text)) {
      issues.push({
        level: "warning",
        code: "no_thaana",
        message: `${layer.name} is marked Dhivehi but contains no Thaana characters.`,
        layerId: layer.id,
      });
    }

    // 2 & 3. Encoding corruption / replacement char
    if (hasReplacementChar(text)) {
      issues.push({
        level: "error",
        code: "encoding_corrupted",
        message: `${layer.name} contains the Unicode replacement character (U+FFFD) — text was likely corrupted on paste.`,
        layerId: layer.id,
      });
    }

    // 4. Suspicious bidi control characters
    if (hasSuspiciousBidi(text)) {
      issues.push({
        level: "warning",
        code: "bidi_controls",
        message: `${layer.name} contains bidirectional control characters. Review before approving — they can change how text is ordered.`,
        layerId: layer.id,
      });
    }

    // 5 & 6. Font loaded and supports glyphs (Dhivehi layers)
    if (layer.language === "dv" && layer.fontId) {
      const loaded = input.fontLoaded[layer.fontId];
      if (loaded === false) {
        issues.push({
          level: "error",
          code: "font_failed",
          message: `The Thaana font for ${layer.name} failed to load.`,
          layerId: layer.id,
        });
      }
    }

    // 7. Overflow
    if (input.overflow[layer.id]) {
      issues.push({
        level: "error",
        code: "overflow",
        message: `${layer.name} overflows its text box. Shorten the copy or enlarge the box.`,
        layerId: layer.id,
      });
    }

    // 8. Max line count
    if (layer.maxLines && input.lineCount[layer.id] > layer.maxLines) {
      issues.push({
        level: "warning",
        code: "max_lines",
        message: `${layer.name} exceeds its maximum of ${layer.maxLines} lines.`,
        layerId: layer.id,
      });
    }

    // 9. Below minimum font size
    if (layer.autoFit && layer.fontSize < layer.minFontSize) {
      issues.push({
        level: "warning",
        code: "min_size",
        message: `${layer.name} was auto-fit below its minimum font size.`,
        layerId: layer.id,
      });
    }

    // 12. Contrast against a solid background color
    const bg =
      layer.backgroundColor && layer.backgroundColor !== "transparent"
        ? layer.backgroundColor
        : input.backgroundColor;
    if (bg) {
      const ratio = contrastRatio(layer.color, bg);
      if (ratio !== null && ratio < 3) {
        issues.push({
          level: "warning",
          code: "contrast",
          message: `${layer.name} has low contrast (${ratio.toFixed(1)}:1) against its background.`,
          layerId: layer.id,
        });
      }
    }
  }

  if (issues.length === 0) {
    issues.push({
      level: "passed",
      code: "ok",
      message: "All checks passed.",
    });
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some(
    (i) => i.level === "error" && BLOCKING_CODES.has(i.code),
  );
}
