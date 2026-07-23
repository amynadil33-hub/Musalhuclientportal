// Thaana glyph validation.
//
// Binary font-table inspection is impractical in the browser, so we use a
// canvas width-comparison technique: render Thaana text with `"<family>",
// <generic>` and with just `<generic>`. If the family provides the glyphs the
// measured widths differ; if the family lacks them the browser falls back to
// the same generic font and the widths match. This is a well-established
// character-support heuristic and is clearly a heuristic, not a guarantee.

export type GlyphStatus = "supported" | "partial" | "failed" | "unavailable";

export interface GlyphCheckResult {
  status: GlyphStatus;
  message: string;
  supportedCount: number;
  totalCount: number;
}

// Representative characters across the Thaana Unicode block U+0780–U+07BF.
const THAANA_SAMPLES = [
  "\u0780", // haa
  "\u0788", // vaavu
  "\u0790", // seenu
  "\u0798", // daviyani
  "\u07A6", // abafili
  "\u07AF", // sukun-ish region
  "\u07B1", // naa
];

const SAMPLE_PHRASE = "\u078B\u07A8\u0788\u07AC\u0780\u07A8"; // ދިވެހި

function measure(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  generic: string,
): number {
  ctx.font = `72px ${family ? `"${family}", ` : ""}${generic}`;
  return ctx.measureText(text).width;
}

function charSupported(
  ctx: CanvasRenderingContext2D,
  ch: string,
  family: string,
): boolean {
  // Compare against two different generic fallbacks. If the family provides
  // the glyph, its width is independent of which generic we append.
  const a = measure(ctx, ch, family, "monospace");
  const b = measure(ctx, ch, family, "serif");
  const baseMono = measure(ctx, ch, "", "monospace");
  const baseSerif = measure(ctx, ch, "", "serif");
  // Family glyph present when the family-rendered widths agree with each other
  // but differ from at least one generic baseline.
  const familyConsistent = Math.abs(a - b) < 0.5;
  const differsFromBaseline =
    Math.abs(a - baseMono) > 0.5 || Math.abs(b - baseSerif) > 0.5;
  return familyConsistent && differsFromBaseline;
}

/**
 * Check whether a loaded font family renders Thaana glyphs.
 * The font must already be loaded via loadFont() / document.fonts.
 */
export function checkThaanaGlyphs(family: string): GlyphCheckResult {
  if (typeof document === "undefined") {
    return {
      status: "unavailable",
      message: "Glyph validation is only available in the browser.",
      supportedCount: 0,
      totalCount: THAANA_SAMPLES.length,
    };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      status: "unavailable",
      message: "Could not create a canvas context for validation.",
      supportedCount: 0,
      totalCount: THAANA_SAMPLES.length,
    };
  }

  // If the family isn't loaded at all, the phrase width will equal the pure
  // generic baseline.
  const phraseWithFamily = measure(ctx, SAMPLE_PHRASE, family, "monospace");
  const phraseBaseline = measure(ctx, SAMPLE_PHRASE, "", "monospace");
  const familyHadEffect = Math.abs(phraseWithFamily - phraseBaseline) > 0.5;

  let supported = 0;
  for (const ch of THAANA_SAMPLES) {
    if (charSupported(ctx, ch, family)) supported++;
  }

  const total = THAANA_SAMPLES.length;

  if (supported === 0 && !familyHadEffect) {
    return {
      status: "failed",
      message:
        "The font did not render any Thaana glyphs (it falls back to another family).",
      supportedCount: 0,
      totalCount: total,
    };
  }
  if (supported >= total) {
    return {
      status: "supported",
      message: "Thaana glyphs detected across the tested Unicode range.",
      supportedCount: supported,
      totalCount: total,
    };
  }
  if (supported > 0) {
    return {
      status: "partial",
      message: `Only ${supported} of ${total} tested Thaana characters rendered from this font.`,
      supportedCount: supported,
      totalCount: total,
    };
  }
  return {
    status: "failed",
    message: "No representative Thaana glyphs were found in this font.",
    supportedCount: 0,
    totalCount: total,
  };
}
