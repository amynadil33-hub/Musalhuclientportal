import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { resolveDirection, resolveLang, segmentBidi } from "@/lib/dhivehi/text.ts";
import { THAANA_FALLBACK_STACK } from "@/lib/dhivehi/constants.ts";

export type LayerLike = Doc<"dhivehi_layers">;

/**
 * Renders a single layer at TRUE canvas pixel coordinates. This same component
 * is used for the on-screen editor stage and for export capture, guaranteeing
 * that what you see is exactly what gets exported.
 */
export function LayerView({ layer }: { layer: LayerLike }) {
  const common: React.CSSProperties = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
    opacity: layer.hidden ? 0 : layer.opacity ?? 1,
    zIndex: layer.zIndex,
    pointerEvents: "none",
  };

  if (layer.layerType === "logo" || layer.layerType === "image") {
    return (
      <div style={common}>
        {layer.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={layer.imageUrl || "/placeholder.svg"}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: layer.borderRadius ?? 0,
            }}
          />
        ) : null}
      </div>
    );
  }

  if (layer.layerType === "shape") {
    return (
      <div
        style={{
          ...common,
          backgroundColor: layer.shape === "line" ? undefined : layer.fillColor ?? "#000000",
          borderTop:
            layer.shape === "line"
              ? `${layer.borderWidth ?? 2}px solid ${layer.fillColor ?? "#000000"}`
              : undefined,
          borderRadius:
            layer.shape === "ellipse" ? "50%" : layer.borderRadius ?? 0,
          border:
            layer.borderWidth && layer.shape !== "line"
              ? `${layer.borderWidth}px solid ${layer.borderColor ?? "#000000"}`
              : undefined,
        }}
      />
    );
  }

  // Text layer
  const direction = resolveDirection(layer.layerType, layer.direction);
  const lang = resolveLang(layer.layerType);
  const fontFamily =
    layer.fontFamily && direction === "rtl"
      ? `${layer.fontFamily}, ${THAANA_FALLBACK_STACK}`
      : layer.fontFamily || (direction === "rtl" ? THAANA_FALLBACK_STACK : "Inter, sans-serif");

  const align =
    (layer.textAlign as React.CSSProperties["textAlign"]) ??
    (direction === "rtl" ? "right" : "left");

  const shadow = layer.textShadow ? "0 2px 8px rgba(0,0,0,0.45)" : undefined;
  const stroke =
    layer.strokeWidth && layer.strokeColor
      ? `${layer.strokeWidth}px ${layer.strokeColor}`
      : undefined;

  const segments = segmentBidi(layer.text ?? "");

  return (
    <div style={common}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent:
            align === "center"
              ? "center"
              : align === "left"
                ? "flex-start"
                : "flex-end",
          backgroundColor: layer.backgroundColor
            ? hexWithOpacity(layer.backgroundColor, layer.backgroundOpacity ?? 1)
            : undefined,
          padding: layer.padding ?? 0,
          borderRadius: layer.borderRadius ?? 0,
          border:
            layer.borderWidth && layer.borderColor
              ? `${layer.borderWidth}px solid ${layer.borderColor}`
              : undefined,
          boxSizing: "border-box",
        }}
      >
        <div
          dir={direction}
          lang={lang}
          style={{
            width: "100%",
            fontFamily,
            fontSize: layer.fontSize ?? 32,
            fontWeight: (layer.fontWeight as never) ?? 400,
            lineHeight: layer.lineHeight ?? 1.3,
            letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
            color: layer.textColor ?? "#ffffff",
            textAlign: align,
            direction,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            textShadow: shadow,
            WebkitTextStroke: stroke,
            paintOrder: "stroke fill",
          }}
        >
          {segments.map((seg, i) =>
            seg.ltr ? (
              <bdi key={i} dir="ltr" style={{ unicodeBidi: "isolate" }}>
                {seg.text}
              </bdi>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function hexWithOpacity(hex: string, opacity: number): string {
  if (opacity >= 1) return hex;
  const c = hex.replace("#", "");
  const full =
    c.length === 3
      ? c.split("").map((x) => x + x).join("")
      : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
