import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Layer } from "@/lib/dhivehi/types.ts";
import LayerView from "./LayerView.tsx";

interface CanvasProps {
  width: number;
  height: number;
  backgroundUrl?: string;
  backgroundColor?: string;
  layers: Layer[];
  selectedId: string | null;
  showSafeZone: boolean;
  onSelect: (id: string | null) => void;
  onLayerChange: (id: string, patch: Partial<Layer>) => void;
  exportRef?: React.RefObject<HTMLDivElement | null>;
}

type DragMode =
  | { type: "move"; startX: number; startY: number; lx: number; ly: number }
  | {
      type: "resize";
      startX: number;
      startY: number;
      lx: number;
      ly: number;
      lw: number;
      lh: number;
    };

export default function Canvas({
  width,
  height,
  backgroundUrl,
  backgroundColor,
  layers,
  selectedId,
  showSafeZone,
  onSelect,
  onLayerChange,
  exportRef,
}: CanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{ id: string; mode: DragMode } | null>(null);

  // Fit canvas into the available viewport width/height.
  useLayoutEffect(() => {
    const compute = () => {
      const el = wrapRef.current;
      if (!el) return;
      const availW = el.clientWidth - 48;
      const availH = el.clientHeight - 48;
      const s = Math.min(availW / width, availH / height, 1);
      setScale(s > 0 ? s : 0.1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [width, height]);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { id, mode } = drag;
      const dx = (e.clientX - mode.startX) / scale;
      const dy = (e.clientY - mode.startY) / scale;
      if (mode.type === "move") {
        onLayerChange(id, {
          x: Math.round(mode.lx + dx),
          y: Math.round(mode.ly + dy),
        });
      } else {
        onLayerChange(id, {
          width: Math.max(24, Math.round(mode.lw + dx)),
          height: Math.max(20, Math.round(mode.lh + dy)),
        });
      }
    },
    [scale, onLayerChange],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
  }, [onPointerMove]);

  const startMove = (e: React.PointerEvent, layer: Layer) => {
    if (layer.locked) return;
    e.stopPropagation();
    onSelect(layer.id);
    dragRef.current = {
      id: layer.id,
      mode: {
        type: "move",
        startX: e.clientX,
        startY: e.clientY,
        lx: layer.x,
        ly: layer.y,
      },
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
  };

  const startResize = (e: React.PointerEvent, layer: Layer) => {
    e.stopPropagation();
    onSelect(layer.id);
    dragRef.current = {
      id: layer.id,
      mode: {
        type: "resize",
        startX: e.clientX,
        startY: e.clientY,
        lx: layer.x,
        ly: layer.y,
        lw: layer.width,
        lh: layer.height,
      },
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
  };

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#0a0a0a] bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px]"
      onPointerDown={() => onSelect(null)}
    >
      <div
        style={{
          width: width * scale,
          height: height * scale,
        }}
        className="relative shadow-2xl"
      >
        {/* The export target renders at full resolution, scaled down visually. */}
        <div
          ref={exportRef}
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: backgroundColor || "#1a1a1a",
            overflow: "hidden",
          }}
        >
          {backgroundUrl && (
            <img
              src={backgroundUrl || "/placeholder.svg"}
              alt=""
              crossOrigin="anonymous"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          {sortedLayers.map((layer) => (
            <LayerView key={layer.id} layer={layer} />
          ))}
        </div>

        {/* Interaction overlay (not exported) */}
        <div
          style={{
            width: width * scale,
            height: height * scale,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {showSafeZone && (
            <div
              className="pointer-events-none absolute border border-dashed border-primary/40"
              style={{
                left: width * scale * 0.05,
                top: height * scale * 0.05,
                width: width * scale * 0.9,
                height: height * scale * 0.9,
              }}
            />
          )}
          {sortedLayers.map((layer) => {
            if (layer.hidden) return null;
            const selected = layer.id === selectedId;
            return (
              <div
                key={layer.id}
                onPointerDown={(e) => startMove(e, layer)}
                style={{
                  position: "absolute",
                  left: layer.x * scale,
                  top: layer.y * scale,
                  width: layer.width * scale,
                  height: layer.height * scale,
                  transform: `rotate(${layer.rotation}deg)`,
                  cursor: layer.locked ? "not-allowed" : "move",
                  outline: selected
                    ? "2px solid var(--primary)"
                    : "1px dashed transparent",
                  outlineOffset: 0,
                }}
                className="hover:outline-primary/50 hover:outline-1 hover:outline-dashed"
              >
                {selected && !layer.locked && (
                  <div
                    onPointerDown={(e) => startResize(e, layer)}
                    className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm bg-primary border border-background cursor-nwse-resize"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground bg-background/70 px-2 py-1 rounded">
        {width} × {height} · {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
