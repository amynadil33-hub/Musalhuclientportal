import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { loadFont } from "@/lib/dhivehi/fonts.ts";
import { checkThaanaGlyphs } from "@/lib/dhivehi/glyph-check.ts";
import { cn } from "@/lib/utils.ts";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";

const STATUS_META: Record<
  string,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  supported: { label: "Thaana supported", icon: CheckCircle2, className: "text-green-500" },
  partial: { label: "Partial support", icon: AlertTriangle, className: "text-amber-500" },
  failed: { label: "Thaana glyphs unavailable", icon: XCircle, className: "text-destructive" },
  unavailable: { label: "Font failed to load", icon: XCircle, className: "text-destructive" },
  pending: { label: "Not yet validated", icon: AlertTriangle, className: "text-muted-foreground" },
};

export default function FontCard({ font }: { font: Doc<"dhivehi_fonts"> }) {
  const setValidation = useMutation(api.dhivehiFonts.setValidationStatus);
  const setActive = useMutation(api.dhivehiFonts.setActive);
  const remove = useMutation(api.dhivehiFonts.remove);

  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    loadFont({
      cssFamily: font.cssFamily,
      fontUrl: font.fontUrl,
      fontWeight: font.fontWeight,
      fontStyle: font.fontStyle,
    }).then((state) => {
      if (!cancelled) setLoadState(state === "loaded" ? "loaded" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [font.cssFamily, font.fontUrl, font.fontWeight, font.fontStyle]);

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const state = await loadFont({
        cssFamily: font.cssFamily,
        fontUrl: font.fontUrl,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
      });
      if (state !== "loaded") {
        await setValidation({ fontId: font._id, glyphValidationStatus: "unavailable" });
        toast.error("Font failed to load");
        return;
      }
      await document.fonts.ready;
      const result = checkThaanaGlyphs(font.cssFamily);
      await setValidation({ fontId: font._id, glyphValidationStatus: result.status });
      toast[result.status === "supported" ? "success" : "warning"](result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setChecking(false);
    }
  };

  const handleToggleActive = async () => {
    setBusy(true);
    try {
      await setActive({ fontId: font._id, active: !font.active });
      toast.success(font.active ? "Font deactivated" : "Font activated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update font");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await remove({ fontId: font._id });
      toast.success("Font removed");
    } catch {
      toast.error("Could not remove font");
    } finally {
      setBusy(false);
    }
  };

  const meta = STATUS_META[font.glyphValidationStatus] ?? STATUS_META.pending;
  const StatusIcon = loadState === "error" ? XCircle : meta.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">
              {font.displayName}
            </h3>
            {font.active && (
              <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono truncate">
            {font.cssFamily} · {font.fileFormat.toUpperCase()}
            {font.isVariable ? " · variable" : ""}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-[11px] shrink-0",
            loadState === "error" ? "text-destructive" : meta.className,
          )}
        >
          {loadState === "loading" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <StatusIcon size={13} />
          )}
          <span className="whitespace-nowrap">
            {loadState === "error" ? "Font failed to load" : meta.label}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-md border border-border bg-background/60 p-4 space-y-2 text-right"
        dir="rtl"
        lang="dv"
        style={{
          fontFamily: `"${font.cssFamily}", "Noto Sans Thaana", sans-serif`,
        }}
      >
        <p className="text-2xl leading-relaxed text-foreground">
          ދިވެހި އިޝްތިހާރު ނަމޫނާ
        </p>
        <p className="text-lg text-muted-foreground">
          އަގު <bdi dir="ltr">MVR 2,500</bdi>
        </p>
        <p className="text-lg text-muted-foreground">
          ގުޅުއްވާ <bdi dir="ltr">+960 777 1234</bdi>
        </p>
      </div>

      {font.supportedUses && font.supportedUses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {font.supportedUses.map((u) => (
            <span
              key={u}
              className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize"
            >
              {u}
            </span>
          ))}
        </div>
      )}

      {font.licenceName && (
        <p className="text-[10px] text-muted-foreground">
          Licence: {font.licenceName}
          {font.commercialUseConfirmed ? " · commercial use confirmed" : ""}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={handleRecheck} disabled={checking}>
          <RefreshCw size={12} className={checking ? "animate-spin" : undefined} />
          {checking ? "Checking" : "Re-check"}
        </Button>
        <Button
          size="sm"
          variant={font.active ? "outline" : "default"}
          onClick={handleToggleActive}
          disabled={busy}
        >
          <Power size={12} /> {font.active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={busy}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
