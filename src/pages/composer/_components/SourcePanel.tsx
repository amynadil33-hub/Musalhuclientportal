import { useMemo } from "react";
import type { Layer, TextLayer, ReviewStatus } from "@/lib/dhivehi/types.ts";
import { isTextLayer, REVIEW_STATUSES } from "@/lib/dhivehi/types.ts";
import {
  containsThaana,
  hasReplacementChar,
  hasSuspiciousBidi,
  stripSuspiciousBidi,
} from "@/lib/dhivehi/validation.ts";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import PhrasePicker from "./PhrasePicker.tsx";
import { cn } from "@/lib/utils.ts";
import { AlertTriangle, Type as TypeIcon, ChevronRight } from "lucide-react";

const REVIEW_COLORS: Record<ReviewStatus, string> = {
  "AI Draft": "bg-muted text-muted-foreground",
  "Needs Review": "bg-amber-500/15 text-amber-500",
  Reviewed: "bg-sky-500/15 text-sky-400",
  Approved: "bg-green-500/15 text-green-500",
  Locked: "bg-primary/15 text-primary",
};

function TextLayerRow({
  layer,
  isSelected,
  onSelect,
  onUpdate,
}: {
  layer: TextLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Layer>) => void;
}) {
  const warnings = useMemo(() => {
    const w: string[] = [];
    const t = layer.text ?? "";
    if (layer.language === "dv" && t.trim() && !containsThaana(t))
      w.push("No Thaana characters");
    if (hasReplacementChar(t)) w.push("Corrupted characters (U+FFFD)");
    if (hasSuspiciousBidi(t)) w.push("Bidi control characters");
    return w;
  }, [layer.text, layer.language]);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-md border p-3 space-y-2 cursor-pointer transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ChevronRight
            size={12}
            className={cn(
              "text-primary transition-transform",
              isSelected ? "rotate-90" : "opacity-0",
            )}
          />
          <span className="text-xs font-medium text-foreground truncate">
            {layer.name}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
            {layer.language}
          </span>
        </div>
        <span
          className={cn(
            "text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0",
            REVIEW_COLORS[layer.reviewStatus],
          )}
        >
          {layer.reviewStatus}
        </span>
      </div>

      <Textarea
        value={layer.text}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate({ text: e.target.value })}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (hasSuspiciousBidi(pasted)) {
            e.preventDefault();
            onUpdate({ text: stripSuspiciousBidi(pasted) });
          }
        }}
        dir={layer.direction}
        lang={layer.language === "dv" ? "dv" : undefined}
        rows={layer.layerType.includes("body") ? 3 : 2}
        placeholder={
          layer.language === "dv" ? "ދިވެހި ލިޔުއްވާ" : "Enter text"
        }
        className={cn(
          "text-base resize-none",
          layer.language === "dv" && "leading-relaxed",
        )}
        style={
          layer.language === "dv"
            ? { fontFamily: `${layer.fontFamily}, var(--font-thaana)` }
            : undefined
        }
      />

      {warnings.length > 0 && (
        <div className="space-y-0.5">
          {warnings.map((w) => (
            <p
              key={w}
              className="flex items-center gap-1 text-[10px] text-amber-500"
            >
              <AlertTriangle size={10} /> {w}
            </p>
          ))}
        </div>
      )}

      {isSelected && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1">
            {REVIEW_STATUSES.map((s) => (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({
                    reviewStatus: s,
                    reviewedAt: Date.now(),
                  });
                }}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                  layer.reviewStatus === s
                    ? REVIEW_COLORS[s] + " border-transparent"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {layer.language === "dv" && (
            <PhrasePicker
              onInsert={(dv) =>
                onUpdate({
                  text: layer.text ? `${layer.text} ${dv}` : dv,
                  reviewStatus: "Needs Review",
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function SourcePanel({
  layers,
  selectedId,
  onSelect,
  onUpdate,
}: {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
}) {
  const textLayers = layers.filter(isTextLayer);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <TypeIcon size={13} /> Copy &amp; Content
        </h2>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          Edit ad copy here. Dhivehi text must be reviewed before approval.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {textLayers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No text layers yet. Add one from the toolbar.
          </p>
        ) : (
          textLayers.map((layer) => (
            <TextLayerRow
              key={layer.id}
              layer={layer}
              isSelected={layer.id === selectedId}
              onSelect={() => onSelect(layer.id)}
              onUpdate={(patch) => onUpdate(layer.id, patch)}
            />
          ))
        )}
      </div>
    </div>
  );
}
