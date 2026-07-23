export interface OutputFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
  transparent?: boolean;
}

export const OUTPUT_FORMATS: OutputFormat[] = [
  { id: "ig_portrait", label: "Instagram Portrait", width: 1080, height: 1350, ratio: "4:5" },
  { id: "ig_square", label: "Instagram Square", width: 1080, height: 1080, ratio: "1:1" },
  { id: "story_reel", label: "Story / Reel", width: 1080, height: 1920, ratio: "9:16" },
  { id: "fb_landscape", label: "Facebook Landscape", width: 1200, height: 628, ratio: "1.91:1" },
  { id: "video_cover", label: "Landscape Video Cover", width: 1920, height: 1080, ratio: "16:9" },
  { id: "reel_overlay", label: "Reel Overlay (transparent)", width: 1080, height: 1920, ratio: "9:16", transparent: true },
  { id: "custom", label: "Custom Size", width: 1080, height: 1080, ratio: "custom" },
];

export function getFormat(id: string): OutputFormat | undefined {
  return OUTPUT_FORMATS.find((f) => f.id === id);
}

// Safe-area insets as a fraction of the canvas dimension.
export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// A general content margin applied to all formats.
export const DEFAULT_SAFE_MARGIN = 0.06;

// Platform-specific danger zones for 9:16 Story/Reel content, expressed as
// fractions of height/width. These mark areas where UI overlaps the design.
export interface PlatformGuide {
  label: string;
  // top/bottom are fractions of height; right is a fraction of width
  topZone: number;
  bottomZone: number;
  rightZone: number;
}

export const STORY_REEL_GUIDE: PlatformGuide = {
  label: "Story / Reel safe zones",
  topZone: 0.12, // status bar + profile
  bottomZone: 0.2, // caption + CTA
  rightZone: 0.14, // engagement controls
};

export function isVerticalStory(format: OutputFormat | undefined): boolean {
  return !!format && format.width === 1080 && format.height === 1920;
}
