import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { OUTPUT_FORMATS } from "@/lib/dhivehi/formats.ts";
import { COMPOSITION_STATUSES } from "@/lib/dhivehi/types.ts";
import type { TextLayerType } from "@/lib/dhivehi/types.ts";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Plus,
  Type,
  Square,
  Circle,
  Minus,
  ImageIcon,
  Download,
  Grid2x2,
  Save,
  Loader2,
  Check,
} from "lucide-react";

const TEXT_ADDS: { type: TextLayerType; label: string }[] = [
  { type: "dv_headline", label: "Dhivehi Headline" },
  { type: "dv_subheadline", label: "Dhivehi Subheadline" },
  { type: "dv_body", label: "Dhivehi Body" },
  { type: "en_headline", label: "English Headline" },
  { type: "en_body", label: "English Body" },
  { type: "price", label: "Price" },
  { type: "cta", label: "Call to Action" },
  { type: "phone", label: "Phone Number" },
  { type: "website", label: "Website" },
  { type: "custom", label: "Custom Text" },
];

interface ToolbarProps {
  title: string;
  status: string;
  formatId: string;
  showSafeZone: boolean;
  canUndo: boolean;
  canRedo: boolean;
  saveState: "idle" | "saving" | "saved";
  exporting: boolean;
  onTitleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onFormatChange: (id: string) => void;
  onToggleSafeZone: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddText: (type: TextLayerType) => void;
  onAddShape: (shape: "rectangle" | "ellipse" | "line") => void;
  onAddImage: () => void;
  onExport: (format: "png" | "jpeg" | "overlay") => void;
  onSave: () => void;
}

export default function ComposerToolbar(props: ToolbarProps) {
  return (
    <header className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar shrink-0 flex-wrap">
      <Link
        to="/composer"
        className="p-1.5 rounded text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
      </Link>

      <input
        value={props.title}
        onChange={(e) => props.onTitleChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-foreground outline-none border-b border-transparent focus:border-primary w-44 px-1"
      />

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={!props.canUndo}
          onClick={props.onUndo}
        >
          <Undo2 size={15} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={!props.canRedo}
          onClick={props.onRedo}
        >
          <Redo2 size={15} />
        </Button>
      </div>

      {/* Add layer */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="secondary" className="h-8">
            <Plus size={14} /> Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
            <Type size={12} /> Text
          </DropdownMenuLabel>
          {TEXT_ADDS.map((t) => (
            <DropdownMenuItem
              key={t.type}
              onClick={() => props.onAddText(t.type)}
              className="text-xs"
            >
              {t.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Elements</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => props.onAddShape("rectangle")} className="text-xs">
            <Square size={12} /> Rectangle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onAddShape("ellipse")} className="text-xs">
            <Circle size={12} /> Ellipse
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onAddShape("line")} className="text-xs">
            <Minus size={12} /> Line
          </DropdownMenuItem>
          <DropdownMenuItem onClick={props.onAddImage} className="text-xs">
            <ImageIcon size={12} /> Image / Logo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Format */}
      <Select value={props.formatId} onValueChange={props.onFormatChange}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OUTPUT_FORMATS.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label} · {f.ratio}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="icon"
        variant={props.showSafeZone ? "default" : "ghost"}
        className="h-8 w-8"
        onClick={props.onToggleSafeZone}
        title="Toggle safe zone"
      >
        <Grid2x2 size={15} />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {/* Save state */}
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 min-w-16 justify-end">
          {props.saveState === "saving" ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Saving
            </>
          ) : props.saveState === "saved" ? (
            <>
              <Check size={11} className="text-green-500" /> Saved
            </>
          ) : null}
        </span>

        <Select value={props.status} onValueChange={props.onStatusChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPOSITION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" className="h-8" onClick={props.onSave}>
          <Save size={14} /> Save
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8" disabled={props.exporting}>
              {props.exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => props.onExport("png")}>
              PNG (high quality)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onExport("jpeg")}>
              JPEG (smaller file)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onExport("overlay")}>
              Transparent overlay (PNG)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
