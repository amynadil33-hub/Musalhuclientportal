// Dynamic font loading and Thaana glyph validation for the Dhivehi Composer.

import { THAANA_FALLBACK_STACK } from "./constants.ts";

// Representative Thaana characters (Unicode block U+0780–U+07BF).
export const THAANA_SAMPLE = "ދިވެހި އިޝްތިހާރު ނަމޫނާ";
export const THAANA_TEST_CHARS = "ހށނރބޅކއވމ";

const loadedFamilies = new Set<string>();

export type FontLoadResult =
  | "supported"
  | "partial"
  | "failed_to_load"
  | "glyphs_unavailable"
  | "unverified";

/**
 * Loads a custom font via the FontFace API. Returns true on success.
 * Safe to call multiple times — already-loaded families are skipped.
 */
export async function loadFontFace(
  cssFamily: string,
  url: string,
  options?: { weight?: string; style?: string },
): Promise<boolean> {
  const key = `${cssFamily}__${options?.weight ?? ""}__${options?.style ?? ""}`;
  if (loadedFamilies.has(key)) return true;
  try {
    const face = new FontFace(cssFamily, `url(${JSON.stringify(url)})`, {
      weight: options?.weight || "normal",
      style: options?.style || "normal",
      display: "swap",
    });
    await face.load();
    document.fonts.add(face);
    loadedFamilies.add(key);
    return true;
  } catch (error) {
    console.log("[v0] Font load failed", cssFamily, error);
    return false;
  }
}

/**
 * Measures whether a font actually renders Thaana glyphs (rather than silently
 * falling back). We compare the rendered width of a Thaana string in the target
 * font vs. a guaranteed-missing-glyph baseline. If widths match a generic
 * fallback, the font likely lacks Thaana coverage.
 */
export function measureThaanaSupport(cssFamily: string): FontLoadResult {
  if (typeof document === "undefined") return "unverified";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "unverified";

  const size = 72;
  const measure = (family: string, text: string) => {
    ctx.font = `${size}px ${family}`;
    return ctx.measureText(text).width;
  };

  // "monospace" is a generic that will render Thaana as tofu/fallback.
  const baselineWidth = measure("monospace", THAANA_SAMPLE);
  const targetWidth = measure(`"${cssFamily}", monospace`, THAANA_SAMPLE);

  // If the target family has no Thaana glyphs, it falls through to monospace
  // and widths will be (nearly) identical.
  const diff = Math.abs(targetWidth - baselineWidth);
  if (diff < 0.5) {
    // Confirm it's not just that the fallback stack itself supports Thaana.
    const fallbackWidth = measure(THAANA_FALLBACK_STACK, THAANA_SAMPLE);
    if (Math.abs(fallbackWidth - baselineWidth) < 0.5) {
      // Even our known-good fallback matches monospace here — inconclusive.
      return "unverified";
    }
    return "glyphs_unavailable";
  }

  // Partial: check a couple of individual chars render distinctly.
  const perCharBaseline = measure("monospace", THAANA_TEST_CHARS);
  const perCharTarget = measure(`"${cssFamily}", monospace`, THAANA_TEST_CHARS);
  if (Math.abs(perCharTarget - perCharBaseline) < 0.5) return "partial";

  return "supported";
}

/**
 * Full validation workflow: load the font, then verify glyph coverage.
 */
export async function validateThaanaFont(
  cssFamily: string,
  url: string,
  options?: { weight?: string; style?: string },
): Promise<FontLoadResult> {
  const loaded = await loadFontFace(cssFamily, url, options);
  if (!loaded) return "failed_to_load";
  await document.fonts.ready;
  return measureThaanaSupport(cssFamily);
}

export type RegisteredFont = {
  _id: string;
  cssFamily: string;
  resolvedUrl?: string | null;
  fontWeight?: string;
  fontStyle?: string;
  glyphValidationStatus: string;
  active: boolean;
};

/**
 * Ensures all provided custom fonts are loaded into the document. Returns the
 * families that failed to load so the caller can block export if needed.
 */
export async function ensureFontsLoaded(
  fonts: RegisteredFont[],
): Promise<{ failed: string[] }> {
  const failed: string[] = [];
  await Promise.all(
    fonts.map(async (font) => {
      if (!font.resolvedUrl) return;
      const ok = await loadFontFace(font.cssFamily, font.resolvedUrl, {
        weight: font.fontWeight,
        style: font.fontStyle,
      });
      if (!ok) failed.push(font.cssFamily);
    }),
  );
  await document.fonts.ready;
  return { failed };
}

export function fontStatusLabel(status: string): {
  label: string;
  tone: "ok" | "warn" | "error";
} {
  switch (status) {
    case "supported":
      return { label: "Thaana supported", tone: "ok" };
    case "partial":
      return { label: "Partial support", tone: "warn" };
    case "failed_to_load":
      return { label: "Font failed to load", tone: "error" };
    case "glyphs_unavailable":
      return { label: "Thaana glyphs unavailable", tone: "error" };
    default:
      return { label: "Not verified", tone: "warn" };
  }
}
