import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import type { Layer } from "@/lib/dhivehi/types.ts";

type FontDoc = Doc<"dhivehi_fonts">;
import { isTextLayer, isShapeLayer } from "@/lib/dhivehi/types.ts";
import { STYLE_PRESETS } from "@/lib/dhivehi/presets.ts";
import { loadFont } from "@/lib/dhivehi/fonts.ts";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={`${label} · ${Math.round(value)}`}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </Row>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = value && value.startsWith("#") ? value : "#ffffff";
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded border border-border bg-transparent cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono"
        />
      </div>
    </Row>
  );
}

export default function PropertiesPanel({
  layer,
  onUpdate,
}: {
  layer: Layer | null;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
}) {
  const fonts = useQuery(api.dhivehiFonts.list, {});

  if (!layer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2">
        <SlidersHorizontal size={22} className="text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Select a layer to edit its style.
        </p>
      </div>
    );
  }

  const patch = (p: Partial<Layer>) => onUpdate(layer.id, p);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <SlidersHorizontal size={13} /> {layer.name}
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Position & size */}
        <div className="grid grid-cols-2 gap-3">
          <Row label="X">
            <Input
              type="number"
              value={Math.round(layer.x)}
              onChange={(e) => patch({ x: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </Row>
          <Row label="Y">
            <Input
              type="number"
              value={Math.round(layer.y)}
              onChange={(e) => patch({ y: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </Row>
          <Row label="Width">
            <Input
              type="number"
              value={Math.round(layer.width)}
              onChange={(e) => patch({ width: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </Row>
          <Row label="Height">
            <Input
              type="number"
              value={Math.round(layer.height)}
              onChange={(e) => patch({ height: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </Row>
        </div>

        <NumberRow
          label="Rotation"
          value={layer.rotation}
          min={-180}
          max={180}
          onChange={(v) => patch({ rotation: v })}
        />
        <NumberRow
          label="Opacity %"
          value={layer.opacity * 100}
          min={0}
          max={100}
          onChange={(v) => patch({ opacity: v / 100 })}
        />

        {isTextLayer(layer) && (
          <>
            <div className="h-px bg-border" />

            {layer.language === "dv" ? (
              <Row label="Thaana font">
                <Select
                  value={layer.fontId ?? ""}
                  onValueChange={async (fontId) => {
                    const f = fonts?.find(
                      (x: FontDoc) => x._id === fontId,
                    );
                    if (!f) return;
                    if (f.fontUrl)
                      await loadFont({
                        cssFamily: f.cssFamily,
                        fontUrl: f.fontUrl,
                      });
                    patch({ fontId, fontFamily: f.cssFamily });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {((fonts ?? []) as FontDoc[]).map((f) => (
                      <SelectItem key={f._id} value={f._id}>
                        {f.displayName}
                      </SelectItem>
                    ))}
                    {fonts && fonts.length === 0 && (
                      <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                        No active fonts. Upload one in Settings.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </Row>
            ) : (
              <Row label="Font family">
                <Select
                  value={layer.fontFamily}
                  onValueChange={(v) => patch({ fontFamily: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Inter", "Montserrat", "Playfair Display"].map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            )}

            <NumberRow
              label="Font size"
              value={layer.fontSize}
              min={10}
              max={220}
              onChange={(v) => patch({ fontSize: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Row label="Weight">
                <Select
                  value={layer.fontWeight}
                  onValueChange={(v) => patch({ fontWeight: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["300", "400", "500", "600", "700", "800", "900"].map(
                      (w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Alignment">
                <div className="flex gap-1">
                  {(
                    [
                      ["start", AlignLeft],
                      ["center", AlignCenter],
                      ["end", AlignRight],
                    ] as const
                  ).map(([val, Icon]) => (
                    <button
                      key={val}
                      onClick={() => patch({ textAlign: val })}
                      className={cn(
                        "flex-1 h-8 rounded border flex items-center justify-center transition-colors",
                        layer.textAlign === val
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </Row>
            </div>

            <NumberRow
              label="Line height ×10"
              value={layer.lineHeight * 10}
              min={8}
              max={25}
              onChange={(v) => patch({ lineHeight: v / 10 })}
            />
            <NumberRow
              label="Letter spacing"
              value={layer.letterSpacing}
              min={-4}
              max={20}
              onChange={(v) => patch({ letterSpacing: v })}
            />

            <ColorRow
              label="Text color"
              value={layer.color}
              onChange={(v) => patch({ color: v })}
            />
            <ColorRow
              label="Background"
              value={
                layer.backgroundColor === "transparent"
                  ? "#000000"
                  : layer.backgroundColor
              }
              onChange={(v) => patch({ backgroundColor: v })}
            />
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">
                Transparent background
              </Label>
              <Switch
                checked={layer.backgroundColor === "transparent"}
                onCheckedChange={(c) =>
                  patch({ backgroundColor: c ? "transparent" : "#000000" })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">
                Text shadow
              </Label>
              <Switch
                checked={layer.textShadow}
                onCheckedChange={(c) => patch({ textShadow: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">
                Auto-fit to box
              </Label>
              <Switch
                checked={layer.autoFit}
                onCheckedChange={(c) => patch({ autoFit: c })}
              />
            </div>

            {/* Style presets */}
            <Row label="Style preset">
              <div className="grid grid-cols-2 gap-1.5">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => patch(p.props)}
                    className="text-[11px] px-2 py-1.5 rounded border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Row>
          </>
        )}

        {isShapeLayer(layer) && (
          <>
            <div className="h-px bg-border" />
            <ColorRow
              label="Fill"
              value={layer.fill}
              onChange={(v) => patch({ fill: v })}
            />
            <NumberRow
              label="Fill opacity %"
              value={layer.fillOpacity * 100}
              min={0}
              max={100}
              onChange={(v) => patch({ fillOpacity: v / 100 })}
            />
            {layer.shape === "rectangle" && (
              <NumberRow
                label="Corner radius"
                value={layer.borderRadius}
                min={0}
                max={120}
                onChange={(v) => patch({ borderRadius: v })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
