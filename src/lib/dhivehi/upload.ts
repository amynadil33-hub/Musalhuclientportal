// Client-side helper to upload a file to Convex storage.
// Usage: pass the URL returned by a `generateUploadUrl` mutation.

export interface UploadResult {
  storageId: string;
}

const MAX_FONT_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_FONT_EXT = ["woff2", "woff", "ttf", "otf"];
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

export function fileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function validateFontFile(file: File): string | null {
  const ext = fileExtension(file.name);
  if (!ALLOWED_FONT_EXT.includes(ext)) {
    return `Unsupported font format ".${ext}". Use WOFF2, WOFF, TTF or OTF.`;
  }
  if (file.size > MAX_FONT_BYTES) {
    return "Font file is too large (max 8 MB).";
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported image type. Use PNG, JPEG, WebP or SVG.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image file is too large (max 15 MB).";
  }
  return null;
}

export async function uploadToConvex(
  uploadUrl: string,
  file: File,
): Promise<UploadResult> {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  const json = (await res.json()) as { storageId: string };
  return { storageId: json.storageId };
}
