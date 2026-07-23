// Export abstraction for the Dhivehi Composer.
//
// We prefer DOM-based rendering because browsers handle RTL, bidi and Unicode
// reliably. The BrowserDomExportProvider uses modern-screenshot, which is
// well-maintained and handles custom fonts and cross-origin images.

import { domToBlob } from "modern-screenshot";

export type AdExportInput = {
  node: HTMLElement;
  width: number;
  height: number;
  type: "png" | "jpeg" | "reel_overlay";
};

export type AdExportResult = {
  blob: Blob;
  width: number;
  height: number;
};

export interface AdExportProvider {
  exportImage(input: AdExportInput): Promise<AdExportResult>;
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error(`Image failed to load: ${img.src}`));
      });
    }),
  );
}

export class BrowserDomExportProvider implements AdExportProvider {
  async exportImage(input: AdExportInput): Promise<AdExportResult> {
    // 1. Fonts must be ready before capture — never export mid-load.
    await document.fonts.ready;
    // 2. Ensure all images are loaded (throws a useful error otherwise).
    await waitForImages(input.node);

    const isJpeg = input.type === "jpeg";
    const transparent = input.type === "reel_overlay";

    const blob = await domToBlob(input.node, {
      width: input.width,
      height: input.height,
      scale: 1,
      quality: isJpeg ? 0.95 : 1,
      type: isJpeg ? "image/jpeg" : "image/png",
      backgroundColor: transparent ? undefined : isJpeg ? "#ffffff" : undefined,
      // modern-screenshot inlines fonts + fetches cross-origin assets
      fetch: {
        requestInit: { mode: "cors" },
      },
    });

    if (!blob) throw new Error("Export produced no output");
    return { blob, width: input.width, height: input.height };
  }
}

/**
 * Placeholder for a future server-side Chromium export path. It is intentionally
 * NOT implemented — we do not claim server rendering works until it is
 * genuinely configured and tested.
 */
export class ServerChromiumExportProvider implements AdExportProvider {
  async exportImage(): Promise<AdExportResult> {
    throw new Error(
      "Server-side Chromium export is not configured in this environment.",
    );
  }
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
