import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import type { Layer } from "../useEditor.ts";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  STYLE_PRESETS,
  REVIEW_STATUSES,
  isDhivehiLayer,
} from "@/lib/dhivehi/constants.ts";
import { stripBidiControls } from "@/lib/dhivehi/validation.ts";
import { cn } from "@/lib/utils.ts";
import { Sparkles, BookText, Upload, Wand2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Font = Doc<"dhivehi_fonts"> & { resolvedUrl?: string | null };

type Props = {
  layer: Layer | null;
  fonts: Font[];
  clientId: Id<"clients">;
  brandTone?: string;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
  onOpenPhrases: () => void;
};

const ALIGNMENTS = ["left", "center", "right"] as const;

export function InspectorPanel({
  layer,
  fonts,
  brandTone,
  onUpdate,
  onOpenPhrases,
}: Props) {
  const generateUploadUrl = useMutation(
    api.dhivehiCompositions.generateUploadUrl,
  );
  const getImageUrl = useMutation(api.dhivehiCompositions.getImageUrl);
  const translate = useAction(api.ai.dhivehiCopy.generate);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!layer) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        Select a layer to edit its properties.
      </div>
    );
  }

  const isText =
    layer.layerType !== "logo" &&
    layer.layerType !== "image" &&
    layer.layerType !== "shape";
  const isDv = isDhivehiLayer(layer.layerType);
  const availableFonts = fonts.filter((f) => f.active);

  const applyPreset = (presetId: string) => {
    const p = STYLE_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    onUpdate(layer._id, {
      fontWeight: p.fontWeight,
      letterSpacing: p.letterSpacing,
      lineHeight: p.lineHeight,
      textColor: p.textColor,
      backgroundColor: p.backgroundColor,
      backgroundOpacity: p.backgroundOpacity,
      padding: p.padding,
      borderRadius: p.borderRadius,
      textShadow: p.textShadow ?? false,
      strokeColor: p.strokeColor,
      strokeWidth: p.strokeWidth,
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const displayUrl = await getImageUrl({ storageId });
      onUpdate(layer._id, {
        imageStorageId: storageId,
        imageUrl: displayUrl ?? undefined,
      });
      toast.success("Image uploaded");
    } catch (e) {
      console.log("[v0] upload failed", e);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const runAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const result = await translate({
        englishSource: aiPrompt.trim(),
        layerType: layer.layerType,
        tone: brandTone,
      });
      onUpdate(layer._id, {
        text: result.dhivehiText,
        reviewStatus: "AI Draft",
      });
      toast.success("Dhivehi draft inserted — please review for accuracy");
      setAiOpen(false);
      setAiPrompt("");
    } catch (e) {
      console.log("[v0] ai copy failed", e);
      toast.error("Could not generate Dhivehi copy");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-heading tracking-wider uppercase text-muted-foreground">
          {isText ? "Text Properties" : layer.layerType === "shape" ? "Shape" : "Image"}
        </h2>
      </div>

      <div className="p-3 space-y-5">
        {/* ---- TEXT CONTENT ---- */}
        {isText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Text {isDv && "(Dhivehi)"}</Label>
              <div className="flex gap-1">
                <button
                  onClick={onOpenPhrases}
                  title="Insert saved phrase"
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/70"
                >
                  <BookText size={11} /> Phrases
                </button>
                {isDv && (
                  <button
                    onClick={() => setAiOpen((v) => !v)}
                    title="AI Dhivehi draft"
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25"
                  >
                    <Sparkles size={11} /> AI
                  </button>
                )}
              </div>
            </div>

            {aiOpen && isDv && (
              <div className="space-y-2 p-2 rounded-md border border-primary/30 bg-primary/5">
                <Label className="text-[10px] text-muted-foreground">
                  Describe the message in English — AI drafts Dhivehi for review
                </Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Special Eid offer, 30% off all items"
                  className="text-xs min-h-16"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={runAi}
                    disabled={aiBusy}
                  >
                    <Wand2 size={12} className="mr-1" />
                    {aiBusy ? "Generating…" : "Generate draft"}
                  </Button>
                </div>
                <p className="text-[10px] text-amber-500 flex items-start gap-1">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  AI Dhivehi can contain errors. A fluent speaker must review
                  before publishing.
                </p>
              </div>
            )}

            <Textarea
              dir={isDv ? "rtl" : "ltr"}
              lang={isDv ? "dv" : "en"}
              value={layer.text ?? ""}
              onChange={(e) =>
                onUpdate(layer._id, {
                  text: stripBidiControls(e.target.value),
                })
              }
              className={cn("min-h-20", isDv && "font-thaana text-lg")}
              placeholder={isDv ? "ދިވެހި ލިޔުއްވާ" : "Enter text"}
            />

            {/* Review status */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Copy review status
              </Label>
              <div className="flex flex-wrap gap-1">
                {REVIEW_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdate(layer._id, { reviewStatus: s })}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border transition-all",
                      layer.reviewStatus === s
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- FONT (text only) ---- */}
        {isText && (
          <div className="space-y-2">
            <Label className="text-xs">Font</Label>
            {isDv && availableFonts.length === 0 && (
              <p className="text-[10px] text-amber-500">
                No custom Dhivehi fonts uploaded. Using the built-in Thaana
                fallback. Add fonts in Settings → Dhivehi Fonts.
              </p>
            )}
            <select
              value={layer.fontId ?? "__fallback__"}
              onChange={(e) => {
                if (e.target.value === "__fallback__") {
                  onUpdate(layer._id, {
                    fontId: undefined,
                    fontFamily: undefined,
                  });
                } else {
                  const f = availableFonts.find((x) => x._id === e.target.value);
                  onUpdate(layer._id, {
                    fontId: e.target.value as Id<"dhivehi_fonts">,
                    fontFamily: f?.cssFamily,
                  });
                }
              }}
              className="w-full bg-input border border-border rounded-md px-2 py-1.5 text-xs"
            >
              <option value="__fallback__">
                {isDv ? "Noto Sans Thaana (fallback)" : "Inter (default)"}
              </option>
              {availableFonts.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.displayName}
                  {f.glyphValidationStatus !== "supported" ? " ⚠" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ---- STYLE PRESETS ---- */}
        {isText && (
          <div className="space-y-2">
            <Label className="text-xs">Style preset</Label>
            <div className="flex flex-wrap gap-1">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- SIZE & FIT ---- */}
        {isText && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Font size</Label>
              <span className="text-[10px] text-muted-foreground">
                {layer.fontSize ?? 32}px
              </span>
            </div>
            <Slider
              min={8}
              max={240}
              step={1}
              value={[layer.fontSize ?? 32]}
              onValueChange={([v]) => onUpdate(layer._id, { fontSize: v })}
            />
            <div className="flex items-center justify-between">
              <Label className="text-xs">Auto-fit to box</Label>
              <Switch
                checked={layer.autoFit ?? false}
                onCheckedChange={(v) => onUpdate(layer._id, { autoFit: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Line height</Label>
                <Input
                  type="number"
                  step={0.05}
                  value={layer.lineHeight ?? 1.3}
                  onChange={(e) =>
                    onUpdate(layer._id, { lineHeight: Number(e.target.value) })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Max lines</Label>
                <Input
                  type="number"
                  value={layer.maxLines ?? ""}
                  onChange={(e) =>
                    onUpdate(layer._id, {
                      maxLines: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Weight</Label>
                <select
                  value={layer.fontWeight ?? "400"}
                  onChange={(e) =>
                    onUpdate(layer._id, { fontWeight: e.target.value })
                  }
                  className="w-full bg-input border border-border rounded-md px-2 py-1 text-xs h-7"
                >
                  {["300", "400", "500", "600", "700", "800"].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Letter spacing</Label>
                <Input
                  type="number"
                  step={0.5}
                  value={layer.letterSpacing ?? 0}
                  onChange={(e) =>
                    onUpdate(layer._id, {
                      letterSpacing: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Alignment</Label>
              <div className="flex gap-1">
                {ALIGNMENTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => onUpdate(layer._id, { textAlign: a })}
                    className={cn(
                      "flex-1 text-[10px] py-1 rounded border capitalize",
                      (layer.textAlign ?? (isDv ? "right" : "left")) === a
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- COLORS ---- */}
        {isText && (
          <div className="space-y-3">
            <ColorRow
              label="Text color"
              value={layer.textColor ?? "#ffffff"}
              onChange={(v) => onUpdate(layer._id, { textColor: v })}
            />
            <ColorRow
              label="Box background"
              value={layer.backgroundColor ?? "#000000"}
              enabled={!!layer.backgroundColor}
              onToggle={(on) =>
                onUpdate(layer._id, {
                  backgroundColor: on ? "#000000" : undefined,
                })
              }
              onChange={(v) => onUpdate(layer._id, { backgroundColor: v })}
            />
            {layer.backgroundColor && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Box opacity</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round((layer.backgroundOpacity ?? 1) * 100)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[layer.backgroundOpacity ?? 1]}
                  onValueChange={([v]) =>
                    onUpdate(layer._id, { backgroundOpacity: v })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Padding</Label>
                    <Input
                      type="number"
                      value={layer.padding ?? 0}
                      onChange={(e) =>
                        onUpdate(layer._id, { padding: Number(e.target.value) })
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Corner radius</Label>
                    <Input
                      type="number"
                      value={layer.borderRadius ?? 0}
                      onChange={(e) =>
                        onUpdate(layer._id, {
                          borderRadius: Number(e.target.value),
                        })
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Text shadow</Label>
              <Switch
                checked={layer.textShadow ?? false}
                onCheckedChange={(v) => onUpdate(layer._id, { textShadow: v })}
              />
            </div>
          </div>
        )}

        {/* ---- IMAGE / LOGO ---- */}
        {(layer.layerType === "logo" || layer.layerType === "image") && (
          <div className="space-y-3">
            {layer.imageUrl && (
              <img
                src={layer.imageUrl || "/placeholder.svg"}
                alt="Layer"
                className="w-full h-24 object-contain bg-muted rounded-md"
              />
            )}
            <label className="flex items-center justify-center gap-2 text-xs py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary">
              <Upload size={14} />
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </label>
          </div>
        )}

        {/* ---- SHAPE ---- */}
        {layer.layerType === "shape" && (
          <div className="space-y-3">
            <ColorRow
              label="Fill color"
              value={layer.fillColor ?? "#000000"}
              onChange={(v) => onUpdate(layer._id, { fillColor: v })}
            />
          </div>
        )}

        {/* ---- COMMON: opacity + position ---- */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Opacity</Label>
            <span className="text-[10px] text-muted-foreground">
              {Math.round((layer.opacity ?? 1) * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[layer.opacity ?? 1]}
            onValueChange={([v]) => onUpdate(layer._id, { opacity: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <PosInput
              label="X"
              value={layer.x}
              onChange={(v) => onUpdate(layer._id, { x: v })}
            />
            <PosInput
              label="Y"
              value={layer.y}
              onChange={(v) => onUpdate(layer._id, { y: v })}
            />
            <PosInput
              label="W"
              value={layer.width}
              onChange={(v) => onUpdate(layer._id, { width: v })}
            />
            <PosInput
              label="H"
              value={layer.height}
              onChange={(v) => onUpdate(layer._id, { height: v })}
            />
            <PosInput
              label="Rotation"
              value={layer.rotation ?? 0}
              onChange={(v) => onUpdate(layer._id, { rotation: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
  enabled,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  enabled?: boolean;
  onToggle?: (on: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-[10px] flex-1">{label}</Label>
      {onToggle && (
        <Switch checked={enabled} onCheckedChange={onToggle} />
      )}
      {(enabled === undefined || enabled) && (
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded border border-border bg-transparent cursor-pointer"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-20 text-[10px]"
          />
        </div>
      )}
    </div>
  );
}

function PosInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground w-12">{label}</span>
      <Input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-7 text-xs"
      />
    </div>
  );
}
