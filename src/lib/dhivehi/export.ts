import { domToBlob } from "modern-screenshot";
import { ensureFontsReady } from "./fonts";

export type ExportFormat = "png" | "jpeg" | "overlay";

export interface AdExportInput {
  node: HTMLElement;
  width: number;
  height: number;
  format: ExportFormat;
  // Solid background for JPEG (which cannot be transparent).
  backgroundColor?: string;
  quality?: number; // jpeg quality 0..1
}

export interface AdExportResult {
  blob: Blob;
  mimeType: string;
}

export interface AdExportProvider {
  readonly name: string;
  exportImage(input: AdExportInput): Promise<AdExportResult>;
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

/**
 * Browser DOM-based exporter. Renders the composition node at its exact pixel
 * size using modern-screenshot, which handles custom fonts, RTL text and
 * cross-origin images reliably.
 */
export class BrowserDomExportProvider implements AdExportProvider {
  readonly name = "browser-dom";

  async exportImage(input: AdExportInput): Promise<AdExportResult> {
    // Guarantee fonts + images are ready before capture.
    await ensureFontsReady();
    await waitForImages(input.node);

    const isJpeg = input.format === "jpeg";
    const mimeType = isJpeg ? "image/jpeg" : "image/png";

    const blob = await domToBlob(input.node, {
      width: input.width,
      height: input.height,
      // Node is rendered at native resolution, so scale 1 → exact pixels.
      scale: 1,
      type: mimeType,
      quality: isJpeg ? (input.quality ?? 0.95) : undefined,
      backgroundColor:
        input.format === "overlay"
          ? undefined
          : (input.backgroundColor ?? (isJpeg ? "#000000" : undefined)),
      // CORS-safe fetching for Convex-hosted assets.
      fetch: {
        requestInit: { cache: "no-cache", mode: "cors" },
      },
      style: {
        // Neutralise any preview transform so capture is 1:1.
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
    });

    if (!blob) {
      throw new Error("Export failed: the renderer returned no image data.");
    }
    return { blob, mimeType };
  }
}

/**
 * Placeholder for a future server-side Chromium exporter. It is intentionally
 * NOT implemented — it must not silently pretend to work.
 */
export class ServerChromiumExportProvider implements AdExportProvider {
  readonly name = "server-chromium";

  async exportImage(): Promise<AdExportResult> {
    throw new Error(
      "Server-side Chromium export is not configured in this environment.",
    );
  }
}

export function getDefaultExportProvider(): AdExportProvider {
  return new BrowserDomExportProvider();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
