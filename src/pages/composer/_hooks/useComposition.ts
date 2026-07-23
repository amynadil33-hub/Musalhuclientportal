import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Layer } from "@/lib/dhivehi/types.ts";

export interface CanvasState {
  title: string;
  canvasWidth: number;
  canvasHeight: number;
  outputFormat: string;
  backgroundStorageId?: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  layers: Layer[];
  status: string;
}

const MAX_HISTORY = 60;

export function useComposition(initial: CanvasState) {
  const [state, setState] = useState<CanvasState>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const past = useRef<CanvasState[]>([]);
  const future = useRef<CanvasState[]>([]);
  const [, forceHistory] = useState(0);

  // Reset everything when a different composition is loaded.
  const initialKeyRef = useRef(initial.title + initial.layers.length);
  useEffect(() => {
    past.current = [];
    future.current = [];
    setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKeyRef.current]);

  const commit = useCallback((updater: (prev: CanvasState) => CanvasState) => {
    setState((prev) => {
      past.current = [...past.current.slice(-MAX_HISTORY), prev];
      future.current = [];
      forceHistory((n) => n + 1);
      return updater(prev);
    });
  }, []);

  const setLayers = useCallback(
    (updater: (layers: Layer[]) => Layer[]) => {
      commit((prev) => ({ ...prev, layers: updater(prev.layers) }));
    },
    [commit],
  );

  const updateLayer = useCallback(
    (id: string, patch: Partial<Layer>) => {
      commit((prev) => ({
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === id ? ({ ...l, ...patch } as Layer) : l,
        ),
      }));
    },
    [commit],
  );

  const addLayer = useCallback(
    (layer: Layer) => {
      commit((prev) => ({ ...prev, layers: [...prev.layers, layer] }));
      setSelectedId(layer.id);
    },
    [commit],
  );

  const removeLayer = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        layers: prev.layers.filter((l) => l.id !== id),
      }));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit],
  );

  const reorderLayer = useCallback(
    (id: string, direction: "up" | "down") => {
      commit((prev) => {
        const sorted = [...prev.layers].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((l) => l.id === id);
        if (idx === -1) return prev;
        const swapWith = direction === "up" ? idx + 1 : idx - 1;
        if (swapWith < 0 || swapWith >= sorted.length) return prev;
        const a = sorted[idx];
        const b = sorted[swapWith];
        const az = a.zIndex;
        return {
          ...prev,
          layers: prev.layers.map((l) => {
            if (l.id === a.id) return { ...l, zIndex: b.zIndex };
            if (l.id === b.id) return { ...l, zIndex: az };
            return l;
          }),
        };
      });
    },
    [commit],
  );

  const patchCanvas = useCallback(
    (patch: Partial<CanvasState>) => {
      commit((prev) => ({ ...prev, ...patch }));
    },
    [commit],
  );

  const undo = useCallback(() => {
    setState((prev) => {
      const previous = past.current[past.current.length - 1];
      if (!previous) return prev;
      past.current = past.current.slice(0, -1);
      future.current = [prev, ...future.current].slice(0, MAX_HISTORY);
      forceHistory((n) => n + 1);
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = future.current[0];
      if (!next) return prev;
      future.current = future.current.slice(1);
      past.current = [...past.current, prev].slice(-MAX_HISTORY);
      forceHistory((n) => n + 1);
      return next;
    });
  }, []);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  const selectedLayer = useMemo(
    () => state.layers.find((l) => l.id === selectedId) ?? null,
    [state.layers, selectedId],
  );

  return {
    state,
    setState,
    selectedId,
    setSelectedId,
    selectedLayer,
    setLayers,
    updateLayer,
    addLayer,
    removeLayer,
    reorderLayer,
    patchCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
