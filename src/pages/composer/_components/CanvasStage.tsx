import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { LayerView } from "./LayerView.tsx";
import { cn } from "@/lib/utils.ts";

type Layer = Doc<"dhivehi_layers">;

type DragState = {
  layerId: string;
  mode: "move" | "resize";
  handle?: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
};

const HANDLES = ["nw", "ne", "sw", "se"] as const;

type Props = {
  width: number;
  height: number;
  backgroundUrl?: string | null;
  backgroundColor?: string;
  safeAreaPreset?: string;
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayerChange: (
    id: string,
    patch: Partial<Pick<Layer, "x" | "y" | "width" | "height">>,
    commit: boolean,
  ) => void;
  showSafeArea: boolean;
};

export const CanvasStage = forwardRef<HTMLDivElement, Props>(function CanvasStage(
  {
    width,
    height,
    backgroundUrl,
    backgroundColor,
    safeAreaPreset,
    layers,
    selectedId,
    onSelect,
    onLayerChange,
    showSafeArea,
  },
  stageRef,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const dragRef = useRef<DragState | null>(null);

  // Fit the full-resolution stage into the available viewport width.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const compute = () => {
      const avail = el.clientWidth - 32;
      const availH = el.clientHeight - 32;
      const s = Math.min(avail / width, availH / height, 1);
      setScale(s > 0 ? s : 0.1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const onPointerDownLayer = useCallback(
    (e: React.PointerEvent, layer: Layer) => {
      if (layer.locked) return;
      e.stopPropagation();
      onSelect(layer._id);
      dragRef.current = {
        layerId: layer._id,
        mode: "move",
        startX: e.clientX,
        startY: e.clientY,
        origX: layer.x,
        origY: layer.y,
        origW: layer.width,
        origH: layer.height,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [onSelect],
  );

  const onPointerDownHandle = useCallback(
    (e: React.PointerEvent, layer: Layer, handle: string) => {
      e.stopPropagation();
      dragRef.current = {
        layerId: layer._id,
        mode: "resize",
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: layer.x,
        origY: layer.y,
        origW: layer.width,
        origH: layer.height,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      if (drag.mode === "move") {
        onLayerChange(
          drag.layerId,
          { x: Math.round(drag.origX + dx), y: Math.round(drag.origY + dy) },
          false,
        );
      } else {
        let { origX: x, origY: y, origW: w, origH: h } = drag;
        const handle = drag.handle!;
        if (handle.includes("e")) w = Math.max(20, drag.origW + dx);
        if (handle.includes("s")) h = Math.max(20, drag.origH + dy);
        if (handle.includes("w")) {
          w = Math.max(20, drag.origW - dx);
          x = drag.origX + dx;
        }
        if (handle.includes("n")) {
          h = Math.max(20, drag.origH - dy);
          y = drag.origY + dy;
        }
        onLayerChange(
          drag.layerId,
          {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(w),
            height: Math.round(h),
          },
          false,
        );
      }
    },
    [scale, onLayerChange],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag) {
      const layer = layers.find((l) => l._id === drag.layerId);
      if (layer) {
        onLayerChange(
          drag.layerId,
          {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
          },
          true,
        );
      }
    }
    dragRef.current = null;
  }, [layers, onLayerChange]);

  const margin =
    safeAreaPreset === "story_reel"
      ? { top: 0.14, bottom: 0.2, side: 0.06 }
      : safeAreaPreset === "social"
        ? { top: 0.06, bottom: 0.06, side: 0.06 }
        : null;

  return (
    <div
      ref={wrapperRef}
      className="relative flex items-center justify-center w-full h-full overflow-hidden bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#242424_0%_50%)] bg-[length:24px_24px]"
      onPointerDown={() => onSelect(null)}
    >
      <div
        style={{
          width: width * scale,
          height: height * scale,
        }}
        className="relative shadow-2xl"
      >
        <div
          ref={stageRef}
          data-export-stage
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: backgroundColor ?? "#111111",
            overflow: "hidden",
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
          ) : null}

          {layers
            .filter((l) => !l.hidden)
            .map((layer) => (
              <LayerView key={layer._id} layer={layer} />
            ))}
        </div>

        {/* Interaction overlay (not exported) */}
        <div
          className="absolute inset-0"
          style={{ width: width * scale, height: height * scale }}
        >
          {margin && showSafeArea && (
            <div
              className="absolute border-2 border-dashed border-primary/40 pointer-events-none"
              style={{
                top: height * scale * margin.top,
                bottom: height * scale * margin.bottom,
                left: width * scale * margin.side,
                right: width * scale * margin.side,
              }}
            />
          )}

          {layers
            .filter((l) => !l.hidden)
            .map((layer) => {
              const isSel = layer._id === selectedId;
              return (
                <div
                  key={layer._id}
                  onPointerDown={(e) => onPointerDownLayer(e, layer)}
                  className={cn(
                    "absolute cursor-move",
                    isSel
                      ? "outline outline-2 outline-primary"
                      : "hover:outline hover:outline-1 hover:outline-primary/50",
                  )}
                  style={{
                    left: layer.x * scale,
                    top: layer.y * scale,
                    width: layer.width * scale,
                    height: layer.height * scale,
                    transform: layer.rotation
                      ? `rotate(${layer.rotation}deg)`
                      : undefined,
                  }}
                >
                  {isSel &&
                    !layer.locked &&
                    HANDLES.map((h) => (
                      <div
                        key={h}
                        onPointerDown={(e) => onPointerDownHandle(e, layer, h)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        className="absolute w-3 h-3 bg-primary border border-background rounded-sm"
                        style={{
                          cursor: `${h}-resize`,
                          left: h.includes("w") ? -6 : undefined,
                          right: h.includes("e") ? -6 : undefined,
                          top: h.includes("n") ? -6 : undefined,
                          bottom: h.includes("s") ? -6 : undefined,
                        }}
                      />
                    ))}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
});
