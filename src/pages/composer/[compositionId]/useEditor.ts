import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";

export type Layer = Doc<"dhivehi_layers">;

type LayerPatch = Partial<Omit<Layer, "_id" | "_creationTime" | "compositionId">>;

/**
 * Local-first editor state. Server data seeds the local layers once; afterwards
 * local state is authoritative for the session and changes are persisted to
 * Convex (debounced for high-frequency edits like dragging and typing).
 */
export function useEditor(
  compositionId: Id<"dhivehi_compositions">,
  serverLayers: Layer[] | undefined,
) {
  const addLayerMut = useMutation(api.dhivehiCompositions.addLayer);
  const updateLayerMut = useMutation(api.dhivehiCompositions.updateLayer);
  const removeLayerMut = useMutation(api.dhivehiCompositions.removeLayer);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const seeded = useRef<string | null>(null);
  const pending = useRef<Map<string, LayerPatch>>(new Map());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Seed once per composition.
  useEffect(() => {
    if (serverLayers && seeded.current !== compositionId) {
      setLayers([...serverLayers].sort((a, b) => a.zIndex - b.zIndex));
      seeded.current = compositionId;
    }
  }, [serverLayers, compositionId]);

  const flush = useCallback(
    (layerId: string) => {
      const patch = pending.current.get(layerId);
      if (!patch || Object.keys(patch).length === 0) return;
      pending.current.delete(layerId);
      updateLayerMut({
        layerId: layerId as Id<"dhivehi_layers">,
        patch: patch as never,
      }).catch((e) => console.log("[v0] layer save failed", e));
    },
    [updateLayerMut],
  );

  const queueSave = useCallback(
    (layerId: string, patch: LayerPatch, immediate: boolean) => {
      const existing = pending.current.get(layerId) ?? {};
      pending.current.set(layerId, { ...existing, ...patch });
      const t = timers.current.get(layerId);
      if (t) clearTimeout(t);
      if (immediate) {
        flush(layerId);
      } else {
        timers.current.set(
          layerId,
          setTimeout(() => flush(layerId), 500),
        );
      }
    },
    [flush],
  );

  const updateLayer = useCallback(
    (layerId: string, patch: LayerPatch, commit = true) => {
      setLayers((prev) =>
        prev.map((l) => (l._id === layerId ? { ...l, ...patch } : l)),
      );
      queueSave(layerId, patch, commit);
    },
    [queueSave],
  );

  const addLayer = useCallback(
    async (args: Omit<Layer, "_id" | "_creationTime" | "compositionId" | "zIndex">) => {
      const maxZ = layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
      const newId = await addLayerMut({
        compositionId,
        zIndex: maxZ + 1,
        ...(args as never),
      });
      // Optimistically add; server seed already happened so we manage locally.
      setLayers((prev) => [
        ...prev,
        {
          ...(args as object),
          _id: newId,
          _creationTime: Date.now(),
          compositionId,
          zIndex: maxZ + 1,
        } as Layer,
      ]);
      setSelectedId(newId);
      return newId;
    },
    [addLayerMut, compositionId, layers],
  );

  const removeLayer = useCallback(
    (layerId: string) => {
      setLayers((prev) => prev.filter((l) => l._id !== layerId));
      if (selectedId === layerId) setSelectedId(null);
      removeLayerMut({ layerId: layerId as Id<"dhivehi_layers"> }).catch((e) =>
        console.log("[v0] remove layer failed", e),
      );
    },
    [removeLayerMut, selectedId],
  );

  const reorder = useCallback(
    (layerId: string, direction: "up" | "down") => {
      setLayers((prev) => {
        const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((l) => l._id === layerId);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx + 1 : idx - 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
        const a = sorted[idx];
        const b = sorted[swapIdx];
        const az = a.zIndex;
        const bz = b.zIndex;
        queueSave(a._id, { zIndex: bz }, true);
        queueSave(b._id, { zIndex: az }, true);
        return prev.map((l) =>
          l._id === a._id
            ? { ...l, zIndex: bz }
            : l._id === b._id
              ? { ...l, zIndex: az }
              : l,
        );
      });
    },
    [queueSave],
  );

  const selected = layers.find((l) => l._id === selectedId) ?? null;

  return {
    layers,
    selected,
    selectedId,
    setSelectedId,
    updateLayer,
    addLayer,
    removeLayer,
    reorder,
  };
}
