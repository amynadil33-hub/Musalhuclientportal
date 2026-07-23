import type { CSSProperties } from "react";
import type { Layer } from "@/lib/dhivehi/types.ts";
import { isTextLayer, isShapeLayer } from "@/lib/dhivehi/types.ts";

// Renders a single layer's *visual* content, positioned absolutely within the
// canvas coordinate space. Used by both the interactive canvas and the export
// clone, so it must stay free of interaction concerns.
export default function LayerView({ layer }: { layer: Layer }) {
  if (layer.hidden) return null;

  const base: CSSProperties = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    transform: `rotate(${layer.rotation}deg)`,
    opacity: layer.opacity,
    zIndex: layer.zIndex,
  };

  if (isTextLayer(layer)) {
    const hasBg =
      layer.backgroundColor && layer.backgroundColor !== "transparent";
    const shadow = layer.textShadow
      ? `0 2px 8px ${layer.shadowColor}`
      : undefined;
    const stroke =
      layer.strokeWidth > 0
        ? `${layer.strokeWidth}px ${layer.strokeColor}`
        : undefined;

    const align =
      layer.textAlign === "center"
        ? "center"
        : layer.textAlign === "end"
          ? "flex-end"
          : "flex-start";

    return (
      <div style={base}>
        <div
          data-layer-id={layer.id}
          dir={layer.direction}
          lang={layer.language === "dv" ? "dv" : undefined}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: align,
            boxSizing: "border-box",
            fontFamily: layer.fontFamily,
            fontSize: layer.fontSize,
            fontWeight: layer.fontWeight as CSSProperties["fontWeight"],
            lineHeight: layer.lineHeight,
            letterSpacing: layer.letterSpacing,
            color: layer.color,
            textAlign: layer.textAlign as CSSProperties["textAlign"],
            padding: layer.padding,
            borderRadius: layer.borderRadius,
            backgroundColor: hasBg ? layer.backgroundColor : undefined,
            border:
              layer.borderWidth > 0
                ? `${layer.borderWidth}px solid ${layer.borderColor}`
                : undefined,
            textShadow: shadow,
            WebkitTextStroke: stroke,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden",
          }}
        >
          {layer.text || " "}
        </div>
      </div>
    );
  }

  if (isShapeLayer(layer)) {
    if (layer.shape === "line") {
      return (
        <div style={base}>
          <div
            style={{
              width: "100%",
              height: Math.max(2, layer.borderWidth || 2),
              backgroundColor: layer.fill,
              opacity: layer.fillOpacity,
              marginTop: layer.height / 2,
            }}
          />
        </div>
      );
    }
    return (
      <div style={base}>
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: layer.fill,
            opacity: layer.fillOpacity,
            borderRadius: layer.shape === "ellipse" ? "50%" : layer.borderRadius,
            border:
              layer.borderWidth > 0
                ? `${layer.borderWidth}px solid ${layer.borderColor}`
                : undefined,
            boxSizing: "border-box",
          }}
        />
      </div>
    );
  }

  // logo & image
  return (
    <div style={base}>
      <img
        src={layer.src || "/placeholder.svg"}
        alt={layer.name}
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}
