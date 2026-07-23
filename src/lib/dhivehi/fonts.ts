// Dynamic Dhivehi/Thaana font loading utilities.
//
// Custom fonts registered in the Font Manager are loaded at runtime via the
// FontFace API. We never rely on an implicit browser fallback for the final
// export — export is blocked unless the required font is confirmed loaded.

// Reliable Thaana-supporting fallback (loaded from Google Fonts in index.css).
export const FALLBACK_THAANA_FAMILY = "Noto Sans Thaana";

export interface LoadableFont {
  cssFamily: string;
  fontUrl?: string;
  fontWeight?: string;
  fontStyle?: string;
}

export type FontLoadState = "loading" | "loaded" | "error";

const loadState = new Map<string, FontLoadState>();
const inflight = new Map<string, Promise<FontLoadState>>();

function key(font: LoadableFont): string {
  return `${font.cssFamily}__${font.fontWeight ?? "400"}__${font.fontStyle ?? "normal"}`;
}

export function getFontState(font: LoadableFont): FontLoadState | undefined {
  return loadState.get(key(font));
}

/**
 * Load a custom font and register it with document.fonts.
 * Safe to call repeatedly — results are cached and in-flight loads deduped.
 */
export async function loadFont(font: LoadableFont): Promise<FontLoadState> {
  if (!font.fontUrl) return "error";
  const k = key(font);

  const existing = loadState.get(k);
  if (existing === "loaded") return "loaded";
  const pending = inflight.get(k);
  if (pending) return pending;

  const promise = (async (): Promise<FontLoadState> => {
    try {
      loadState.set(k, "loading");
      const face = new FontFace(font.cssFamily, `url(${font.fontUrl})`, {
        weight: font.fontWeight ?? "100 900",
        style: font.fontStyle ?? "normal",
        display: "swap",
      });
      await face.load();
      document.fonts.add(face);
      loadState.set(k, "loaded");
      return "loaded";
    } catch {
      loadState.set(k, "error");
      return "error";
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, promise);
  return promise;
}

/**
 * Load several fonts, returning the families that failed.
 */
export async function loadFonts(fonts: LoadableFont[]): Promise<string[]> {
  const results = await Promise.all(
    fonts.map(async (f) => ({ family: f.cssFamily, state: await loadFont(f) })),
  );
  return results.filter((r) => r.state === "error").map((r) => r.family);
}

/** Await full font readiness before capture/export. */
export async function ensureFontsReady(): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
}

/**
 * Confirm a specific family is actually usable right now.
 * Returns false if it is still loading or failed.
 */
export function isFontUsable(font: LoadableFont): boolean {
  if (!font.fontUrl) return true; // system / google font, assume available
  return loadState.get(key(font)) === "loaded";
}

/** Build a CSS font-family stack that always ends in the Thaana fallback. */
export function fontStack(family: string | undefined, isDhivehi: boolean): string {
  const parts: string[] = [];
  if (family) parts.push(`"${family}"`);
  if (isDhivehi) parts.push(`"${FALLBACK_THAANA_FAMILY}"`);
  parts.push("var(--font-sans)");
  return parts.join(", ");
}
