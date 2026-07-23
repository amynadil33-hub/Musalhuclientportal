import { useState } from "react";
import type { Layer } from "../useEditor.ts";
import {
  TEXT_LAYER_TYPES,
  isDhivehiLayer,
} from "@/lib/dhivehi/constants.ts";
import {
  Type,
  ImageIcon,
  Square,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";

type Props = {
  layers: Layer[];
  selectedId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: (id: string) => void;
  onAddText: (typeId: string) => void;
  onAddLogo: () => void;
  onAddShape: (shape: "rect" | "ellipse" | "line") => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
  onRemove: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
};

function layerLabel(layer: Layer): string {
  if (layer.layerType === "logo") return "Logo";
  if (layer.layerType === "image") return "Image";
  if (layer.layerType === "shape")
    return `Shape (${layer.shape ?? "rect"})`;
  const def = TEXT_LAYER_TYPES.find((t) => t.id === layer.layerType);
  const preview = (layer.text ?? "").slice(0, 18);
  return preview || def?.label || layer.layerType;
}

export function LayersPanel({
  layers,
  selectedId,
  onSelect,
  onAddText,
  onAddLogo,
  onAddShape,
  onUpdate,
  onRemove,
  onReorder,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ordered = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-heading tracking-wider uppercase text-muted-foreground">
          Layers
        </h2>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90">
              <Plus size={13} /> Add
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Dhivehi text</DropdownMenuLabel>
            {TEXT_LAYER_TYPES.filter((t) => isDhivehiLayer(t.id)).map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => onAddText(t.id)}>
                <Type size={13} className="mr-2" /> {t.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>English &amp; neutral</DropdownMenuLabel>
            {TEXT_LAYER_TYPES.filter((t) => !isDhivehiLayer(t.id)).map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => onAddText(t.id)}>
                <Type size={13} className="mr-2" /> {t.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Elements</DropdownMenuLabel>
            <DropdownMenuItem onClick={onAddLogo}>
              <ImageIcon size={13} className="mr-2" /> Logo / Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddShape("rect")}>
              <Square size={13} className="mr-2" /> Rectangle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddShape("ellipse")}>
              <Square size={13} className="mr-2" /> Ellipse
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddShape("line")}>
              <Square size={13} className="mr-2" /> Line
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {ordered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-3">
            No layers yet. Use Add to insert text, a logo, or a shape.
          </p>
        ) : (
          ordered.map((layer) => {
            const isSel = layer._id === selectedId;
            return (
              <div
                key={layer._id}
                onClick={() => onSelect(layer._id)}
                className={cn(
                  "group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs",
                  isSel
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span
                  dir={isDhivehiLayer(layer.layerType) ? "rtl" : "ltr"}
                  className="flex-1 truncate"
                >
                  {layerLabel(layer)}
                </span>
                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                  <button
                    title="Move up"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder(layer._id, "up");
                    }}
                    className="p-0.5 hover:text-foreground"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    title="Move down"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder(layer._id, "down");
                    }}
                    className="p-0.5 hover:text-foreground"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    title={layer.hidden ? "Show" : "Hide"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(layer._id, { hidden: !layer.hidden });
                    }}
                    className="p-0.5 hover:text-foreground"
                  >
                    {layer.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button
                    title={layer.locked ? "Unlock" : "Lock"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(layer._id, { locked: !layer.locked });
                    }}
                    className="p-0.5 hover:text-foreground"
                  >
                    {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(layer._id);
                    }}
                    className="p-0.5 hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
