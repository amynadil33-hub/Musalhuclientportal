import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";

import { useComposition } from "../_hooks/useComposition.ts";
import type { CanvasState } from "../_hooks/useComposition.ts";
import ComposerToolbar from "../_components/ComposerToolbar.tsx";
import SourcePanel from "../_components/SourcePanel.tsx";
import PropertiesPanel from "../_components/PropertiesPanel.tsx";
import Canvas from "../_components/Canvas.tsx";
import ValidationBar from "../_components/ValidationBar.tsx";

import type { Layer, TextLayerType } from "@/lib/dhivehi/types.ts";
import { isTextLayer } from "@/lib/dhivehi/types.ts";
import {
  createTextLayer,
  createShapeLayer,
  createImageLayer,
  nextZIndex,
} from "@/lib/dhivehi/factory.ts";
import { getFormat } from "@/lib/dhivehi/formats.ts";
import { validateComposition } from "@/lib/dhivehi/validation.ts";
import {
  getDefaultExportProvider,
  downloadBlob,
} from "@/lib/dhivehi/export.ts";
import { uploadImageFile } from "@/lib/dhivehi/upload.ts";
import { loadFont } from "@/lib/dhivehi/fonts.ts";
import { Loader2 } from "lucide-react";

function newTextDefaults(type: TextLayerType, w: number, h: number) {
  const sizeMap: Partial<Record<TextLayerType, number>> = {
    dv_headline: Math.round(h * 0.06),
    dv_subheadline: Math.round(h * 0.035),
    dv_body: Math.round(h * 0.028),
    en_headline: Math.round(h * 0.05),
    en_body: Math.round(h * 0.026),
    price: Math.round(h * 0.05),
    cta: Math.round(h * 0.03),
  };
  return {
    fontSize: sizeMap[type] ?? Math.round(h * 0.03),
    width: Math.round(w * 0.7),
    height: Math.round(h * 0.12),
    x: Math.round(w * 0.15),
    y: Math.round(h * 0.4),
  };
}

export default function ComposerEditorPage() {
  const { compositionId } = useParams();
  const id = compositionId as Id<"dhivehi_compositions">;

  const data = useQuery(api.dhivehiCompositions.get, { compositionId: id });
  const activeFonts = useQuery(api.dhivehiFonts.list, {});
  const save = useMutation(api.dhivehiCompositions.save);
  const generateUploadUrl = useMutation(
    api.dhivehiCompositions.generateUploadUrl,
  );
  const resolveStorageUrl = useMutation(
    api.dhivehiCompositions.resolveStorageUrl,
  );
  const recordExport = useMutation(api.dhivehiCompositions.recordExport);

  // Build the initial CanvasState once the query resolves.
  const initial: CanvasState | null = useMemo(() => {
    if (!data) return null;
    return {
      title: data.title,
      canvasWidth: data.canvasWidth,
      canvasHeight: data.canvasHeight,
      outputFormat: data.outputFormat,
      backgroundStorageId: data.backgroundStorageId,
      backgroundUrl: data.backgroundUrl,
      backgroundColor: data.backgroundColor,
      layers: (data.layers ?? []) as Layer[],
      status: data.status,
    };
  }, [data]);

  if (data === undefined || initial === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Composition not found.
      </div>
    );
  }

  return (
    <Editor
      key={id}
      id={id}
      initial={initial}
      activeFonts={activeFonts ?? []}
      save={save}
      generateUploadUrl={generateUploadUrl}
      resolveStorageUrl={resolveStorageUrl}
      recordExport={recordExport}
    />
  );
}

type FontDoc = { _id: string; cssFamily: string; fontUrl?: string };

function Editor({
  id,
  initial,
  activeFonts,
  save,
  generateUploadUrl,
  resolveStorageUrl,
  recordExport,
}: {
  id: Id<"dhivehi_compositions">;
  initial: CanvasState;
  activeFonts: FontDoc[];
  save: ReturnType<typeof useMutation>;
  generateUploadUrl: ReturnType<typeof useMutation>;
  resolveStorageUrl: ReturnType<typeof useMutation>;
  recordExport: ReturnType<typeof useMutation>;
}) {
  const comp = useComposition(initial);
  const {
    state,
    selectedId,
    selectedLayer,
    setSelectedId,
    updateLayer,
    addLayer,
    patchCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  } = comp;

  const exportRef = useRef<HTMLDivElement>(null);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [exporting, setExporting] = useState(false);
  const [overflow, setOverflow] = useState<Record<string, boolean>>({});

  const defaultFont = activeFonts[0];

  // Preload all active Thaana fonts so previews render correctly.
  useEffect(() => {
    activeFonts.forEach((f) => {
      if (f.fontUrl) loadFont({ cssFamily: f.cssFamily, fontUrl: f.fontUrl });
    });
  }, [activeFonts]);

  // ---- Debounced autosave ----
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await save({
          compositionId: id,
          title: state.title,
          canvasWidth: state.canvasWidth,
          canvasHeight: state.canvasHeight,
          outputFormat: state.outputFormat,
          backgroundStorageId: state.backgroundStorageId,
          backgroundUrl: state.backgroundUrl,
          backgroundColor: state.backgroundColor,
          layers: state.layers,
        });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("idle");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [state, id, save]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (!typing && (e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        comp.removeLayer(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedId, comp]);

  // ---- Overflow detection ----
  useEffect(() => {
    const node = exportRef.current;
    if (!node) return;
    const next: Record<string, boolean> = {};
    state.layers.forEach((l) => {
      if (!isTextLayer(l)) return;
      // Each text layer's content div is the first child of its wrapper.
      const el = node.querySelector<HTMLElement>(
        `[data-layer-id="${l.id}"]`,
      );
      if (el) next[l.id] = el.scrollHeight > el.clientHeight + 2;
    });
    setOverflow(next);
  }, [state.layers]);

  // ---- Validation ----
  const fontLoaded = useMemo(() => {
    const map: Record<string, boolean> = {};
    activeFonts.forEach((f) => (map[f._id] = true));
    return map;
  }, [activeFonts]);

  const issues = useMemo(
    () =>
      validateComposition({
        layers: state.layers,
        hasBackground: !!(state.backgroundUrl || state.backgroundColor),
        backgroundColor: state.backgroundColor,
        overflow,
        lineCount: {},
        fontLoaded,
      }),
    [state.layers, state.backgroundUrl, state.backgroundColor, overflow, fontLoaded],
  );

  // ---- Layer add handlers ----
  const handleAddText = (type: TextLayerType) => {
    const d = newTextDefaults(type, state.canvasWidth, state.canvasHeight);
    const isDv = type.startsWith("dv_") || type === "cta";
    const layer = createTextLayer({
      layerType: type,
      x: d.x,
      y: d.y,
      width: d.width,
      height: d.height,
      fontSize: d.fontSize,
      fontFamily: isDv
        ? (defaultFont?.cssFamily ?? "var(--font-thaana)")
        : "Montserrat",
      fontId: isDv ? defaultFont?._id : undefined,
      zIndex: nextZIndex(state.layers),
    });
    addLayer(layer);
    if (isDv && !defaultFont) {
      toast.warning("No active Dhivehi font — upload one in Settings.");
    }
  };

  const handleAddShape = (shape: "rectangle" | "ellipse" | "line") => {
    addLayer(
      createShapeLayer({
        shape,
        x: Math.round(state.canvasWidth * 0.3),
        y: Math.round(state.canvasHeight * 0.4),
        width: Math.round(state.canvasWidth * 0.4),
        height: shape === "line" ? 4 : Math.round(state.canvasHeight * 0.1),
        zIndex: nextZIndex(state.layers),
      }),
    );
  };

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { url, storageId } = await uploadImageFile(
          file,
          generateUploadUrl,
          resolveStorageUrl as never,
        );
        addLayer(
          createImageLayer({
            src: url,
            storageId,
            x: Math.round(state.canvasWidth * 0.35),
            y: Math.round(state.canvasHeight * 0.35),
            width: Math.round(state.canvasWidth * 0.3),
            height: Math.round(state.canvasWidth * 0.3),
            zIndex: nextZIndex(state.layers),
          }),
        );
        toast.success("Image added");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    };
    input.click();
  };

  const handleSetBackground = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { url, storageId } = await uploadImageFile(
          file,
          generateUploadUrl,
          resolveStorageUrl as never,
        );
        patchCanvas({ backgroundUrl: url, backgroundStorageId: storageId });
        toast.success("Background set");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    };
    input.click();
  };

  const handleFormatChange = (formatId: string) => {
    const f = getFormat(formatId);
    if (!f) return;
    patchCanvas({
      outputFormat: formatId,
      canvasWidth: f.width,
      canvasHeight: f.height,
    });
  };

  const handleSaveNow = async () => {
    setSaveState("saving");
    await save({
      compositionId: id,
      title: state.title,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      outputFormat: state.outputFormat,
      backgroundStorageId: state.backgroundStorageId,
      backgroundUrl: state.backgroundUrl,
      backgroundColor: state.backgroundColor,
      layers: state.layers,
      status: state.status,
    });
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1500);
    toast.success("Composition saved");
  };

  const handleExport = useCallback(
    async (format: "png" | "jpeg" | "overlay") => {
      const node = exportRef.current;
      if (!node) return;
      setExporting(true);
      setSelectedId(null);
      try {
        const provider = getDefaultExportProvider();
        const { blob, mimeType } = await provider.exportImage({
          node,
          width: state.canvasWidth,
          height: state.canvasHeight,
          format,
          backgroundColor: state.backgroundColor ?? "#111111",
        });

        const ext = mimeType === "image/jpeg" ? "jpg" : "png";
        const safeTitle = state.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        downloadBlob(blob, `${safeTitle || "composition"}-${format}.${ext}`);

        // Persist the export to storage + record it.
        try {
          const uploadUrl = (await generateUploadUrl({})) as string;
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": mimeType },
            body: blob,
          });
          const { storageId } = await res.json();
          await recordExport({
            compositionId: id,
            outputType: format,
            width: state.canvasWidth,
            height: state.canvasHeight,
            storageId,
            status: "completed",
            addToReelStudio: format === "overlay",
          });
        } catch {
          // Download already succeeded; persistence is best-effort.
        }

        toast.success("Exported successfully");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Export failed";
        toast.error(message);
        try {
          await recordExport({
            compositionId: id,
            outputType: format,
            width: state.canvasWidth,
            height: state.canvasHeight,
            status: "failed",
            errorMessage: message,
          });
        } catch {
          /* ignore */
        }
      } finally {
        setExporting(false);
      }
    },
    [state, id, generateUploadUrl, recordExport, setSelectedId],
  );

  const hasBackground = !!(state.backgroundUrl || state.backgroundColor);

  return (
    <div className="flex flex-col h-full">
      <ComposerToolbar
        title={state.title}
        status={state.status}
        formatId={state.outputFormat}
        showSafeZone={showSafeZone}
        canUndo={canUndo}
        canRedo={canRedo}
        saveState={saveState}
        exporting={exporting}
        onTitleChange={(v) => patchCanvas({ title: v })}
        onStatusChange={(v) => patchCanvas({ status: v })}
        onFormatChange={handleFormatChange}
        onToggleSafeZone={() => setShowSafeZone((v) => !v)}
        onUndo={undo}
        onRedo={redo}
        onAddText={handleAddText}
        onAddShape={handleAddShape}
        onAddImage={handleAddImage}
        onExport={handleExport}
        onSave={handleSaveNow}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: copy & content */}
        <aside className="w-72 border-r border-border bg-sidebar shrink-0 hidden lg:flex flex-col">
          <SourcePanel
            layers={state.layers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateLayer}
          />
        </aside>

        {/* Center: canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!hasBackground && (
            <div className="flex items-center justify-center gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500">
              No background set.
              <button
                onClick={handleSetBackground}
                className="underline hover:text-amber-400"
              >
                Upload a source image
              </button>
            </div>
          )}
          <Canvas
            width={state.canvasWidth}
            height={state.canvasHeight}
            backgroundUrl={state.backgroundUrl}
            backgroundColor={state.backgroundColor}
            layers={state.layers}
            selectedId={selectedId}
            showSafeZone={showSafeZone}
            onSelect={setSelectedId}
            onLayerChange={updateLayer}
            exportRef={exportRef}
          />
          <ValidationBar issues={issues} onFocusLayer={setSelectedId} />
        </div>

        {/* Right: properties */}
        <aside className="w-72 border-l border-border bg-sidebar shrink-0 hidden md:flex flex-col">
          <PropertiesPanel layer={selectedLayer} onUpdate={updateLayer} />
        </aside>
      </div>
    </div>
  );
}
