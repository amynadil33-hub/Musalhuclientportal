import type {
  Layer,
  TextLayer,
  TextLayerType,
  LayerLanguage,
  LogoLayer,
  ImageLayer,
  ShapeLayer,
  ShapeKind,
} from "./types";
import { TEXT_LAYER_LABELS } from "./types";

let counter = 0;
export function newId(prefix = "layer") {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

const DV_TYPES: TextLayerType[] = [
  "dv_headline",
  "dv_subheadline",
  "dv_body",
  "cta",
];

export function isDhivehiType(t: TextLayerType): boolean {
  return DV_TYPES.includes(t);
}

export function defaultLanguageFor(t: TextLayerType): LayerLanguage {
  if (isDhivehiType(t)) return "dv";
  if (t.startsWith("en_")) return "en";
  return "neutral";
}

export function createTextLayer(params: {
  layerType: TextLayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontId?: string;
  text?: string;
  align?: "start" | "center" | "end";
  zIndex: number;
}): TextLayer {
  const language = defaultLanguageFor(params.layerType);
  const direction = language === "dv" ? "rtl" : "ltr";
  return {
    id: newId("text"),
    kind: "text",
    name: TEXT_LAYER_LABELS[params.layerType],
    layerType: params.layerType,
    language,
    text: params.text ?? "",
    fontId: params.fontId,
    fontFamily: params.fontFamily,
    fontSize: params.fontSize,
    fontWeight: "600",
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: params.align ?? (direction === "rtl" ? "end" : "start"),
    direction,
    color: "#ffffff",
    backgroundColor: "transparent",
    backgroundOpacity: 1,
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "#000000",
    textShadow: true,
    shadowColor: "#00000080",
    strokeWidth: 0,
    strokeColor: "#000000",
    autoFit: true,
    minFontSize: language === "dv" ? 22 : 16,
    reviewStatus: language === "dv" ? "Needs Review" : "Reviewed",
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    rotation: 0,
    opacity: 1,
    zIndex: params.zIndex,
    locked: false,
    hidden: false,
  };
}

export function createLogoLayer(params: {
  src: string;
  storageId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}): LogoLayer {
  return {
    id: newId("logo"),
    kind: "logo",
    name: "Logo",
    src: params.src,
    storageId: params.storageId,
    variant: "full",
    safeMargin: 12,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    rotation: 0,
    opacity: 1,
    zIndex: params.zIndex,
    locked: false,
    hidden: false,
  };
}

export function createImageLayer(params: {
  src: string;
  storageId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}): ImageLayer {
  return {
    id: newId("image"),
    kind: "image",
    name: "Image",
    src: params.src,
    storageId: params.storageId,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    rotation: 0,
    opacity: 1,
    zIndex: params.zIndex,
    locked: false,
    hidden: false,
  };
}

export function createShapeLayer(params: {
  shape: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}): ShapeLayer {
  return {
    id: newId("shape"),
    kind: "shape",
    name: params.shape === "rectangle" ? "Rectangle" : params.shape === "ellipse" ? "Ellipse" : "Line",
    shape: params.shape,
    fill: "#d4af37",
    fillOpacity: 1,
    borderWidth: 0,
    borderColor: "#000000",
    borderRadius: params.shape === "rectangle" ? 8 : 0,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    rotation: 0,
    opacity: 1,
    zIndex: params.zIndex,
    locked: false,
    hidden: false,
  };
}

export function nextZIndex(layers: Layer[]): number {
  return layers.reduce((m, l) => Math.max(m, l.zIndex), 0) + 1;
}
