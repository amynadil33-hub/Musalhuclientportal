import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";
import {
  BrowserDomExportProvider,
  triggerDownload,
} from "@/lib/dhivehi/export.ts";
import type { ValidationItem } from "@/lib/dhivehi/validation.ts";
import { getBlockingErrors } from "@/lib/dhivehi/validation.ts";
import { Download, AlertTriangle, ImageDown, Film } from "lucide-react";
import { toast } from "sonner";

type OutputType = "png" | "jpeg" | "reel_overlay";

const OUTPUT_OPTIONS: {
  id: OutputType;
  label: string;
  description: string;
  icon: typeof Download;
}[] = [
  {
    id: "png",
    label: "PNG",
    description: "Lossless, transparent-capable — best for social posts",
    icon: ImageDown,
  },
  {
    id: "jpeg",
    label: "JPEG",
    description: "Smaller file, white background — for photos",
    icon: ImageDown,
  },
  {
    id: "reel_overlay",
    label: "Reel Text Overlay",
    description: "Transparent PNG of text only, sent to Reel Studio",
    icon: Film,
  },
];

export function ExportDialog({
  open,
  onClose,
  compositionId,
  title,
  width,
  height,
  getStageNode,
  validation,
}: {
  open: boolean;
  onClose: () => void;
  compositionId: Id<"dhivehi_compositions">;
  title: string;
  width: number;
  height: number;
  getStageNode: () => HTMLElement | null;
  validation: ValidationItem[];
}) {
  const generateUploadUrl = useMutation(api.dhivehiExports.generateUploadUrl);
  const record = useMutation(api.dhivehiExports.record);
  const [type, setType] = useState<OutputType>("png");
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);

  const blocking = getBlockingErrors(validation);

  const handleExport = async () => {
    const node = getStageNode();
    if (!node) {
      toast.error("Canvas not ready");
      return;
    }
    if (blocking.length > 0) {
      toast.error("Resolve blocking errors before exporting");
      return;
    }
    setBusy(true);
    try {
      const provider = new BrowserDomExportProvider();
      const outW = Math.round(width * scale);
      const outH = Math.round(height * scale);

      // For reel overlay we hide the background image inside the node via a
      // data attribute the stage reads; here we just capture with transparency.
      if (type === "reel_overlay") {
        node.setAttribute("data-hide-bg", "true");
      }

      const { blob } = await provider.exportImage({
        node,
        width: outW,
        height: outH,
        type,
      });

      if (type === "reel_overlay") {
        node.removeAttribute("data-hide-bg");
      }

      // Download locally
      const ext = type === "jpeg" ? "jpg" : "png";
      const safeTitle = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      triggerDownload(blob, `${safeTitle || "composition"}.${ext}`);

      // Upload to Convex + record
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await res.json();
      await record({
        compositionId,
        outputType: type,
        width: outW,
        height: outH,
        storageId,
        status: "completed",
      });

      toast.success(
        type === "reel_overlay"
          ? "Overlay exported and sent to Reel Studio"
          : "Exported and saved to composition",
      );
      onClose();
    } catch (e) {
      console.log("[v0] export failed", e);
      await record({
        compositionId,
        outputType: type,
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        status: "failed",
        errorMessage: e instanceof Error ? e.message : "Unknown error",
      }).catch(() => {});
      toast.error("Export failed — see console for details");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export composition</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {blocking.length > 0 && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/30">
              <AlertTriangle
                size={14}
                className="text-destructive mt-0.5 shrink-0"
              />
              <div className="text-xs text-destructive">
                <p className="font-medium mb-1">
                  {blocking.length} blocking issue
                  {blocking.length !== 1 ? "s" : ""} must be fixed:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {blocking.slice(0, 4).map((b) => (
                    <li key={b.id}>{b.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            {OUTPUT_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => setType(o.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-md border transition-all",
                  type === o.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40",
                )}
              >
                <o.icon size={16} className="mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {o.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {o.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Resolution</Label>
            <div className="flex gap-2">
              {[
                { s: 1, label: `1× (${width}×${height})` },
                { s: 2, label: `2× (${width * 2}×${height * 2})` },
              ].map((r) => (
                <button
                  key={r.s}
                  onClick={() => setScale(r.s)}
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-md border",
                    scale === r.s
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={busy || blocking.length > 0}
          >
            <Download size={14} className="mr-1.5" />
            {busy ? "Exporting…" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
