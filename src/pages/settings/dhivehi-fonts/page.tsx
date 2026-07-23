import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import {
  Type,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  FONT_SUPPORTED_USES,
  THAANA_FALLBACK_STACK,
} from "@/lib/dhivehi/constants.ts";
import {
  loadFontFace,
  measureThaanaSupport,
  fontStatusLabel,
  THAANA_SAMPLE,
} from "@/lib/dhivehi/fonts.ts";
import { cn } from "@/lib/utils.ts";

const ACCEPTED = [".woff2", ".woff", ".ttf", ".otf"];
const MAX_SIZE = 6 * 1024 * 1024; // 6MB

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function formatFromName(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  return ext;
}

function StatusPill({ status }: { status: string }) {
  const { label, tone } = fontStatusLabel(status);
  const Icon =
    tone === "ok" ? CheckCircle2 : tone === "warn" ? AlertTriangle : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
        tone === "ok" && "text-green-400 border-green-500/30 bg-green-500/10",
        tone === "warn" && "text-primary border-primary/30 bg-primary/10",
        tone === "error" &&
          "text-destructive border-destructive/30 bg-destructive/10",
      )}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

export default function DhivehiFontsPage() {
  const fonts = useQuery(api.dhivehiFonts.list, { includeInactive: true });
  const generateUploadUrl = useMutation(api.dhivehiFonts.generateUploadUrl);
  const createFont = useMutation(api.dhivehiFonts.create);
  const updateFont = useMutation(api.dhivehiFonts.update);
  const removeFont = useMutation(api.dhivehiFonts.remove);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    fontWeight: "400",
    fontStyle: "normal",
    isVariable: false,
    supportedUses: [] as string[],
    licenceName: "",
    licenceNotes: "",
    commercialUseConfirmed: false,
  });
  const validatingRef = useRef<Set<string>>(new Set());

  // Auto-validate any font that is still unverified once its URL resolves.
  useEffect(() => {
    if (!fonts) return;
    for (const font of fonts) {
      if (
        font.glyphValidationStatus === "unverified" &&
        font.resolvedUrl &&
        !validatingRef.current.has(font._id)
      ) {
        validatingRef.current.add(font._id);
        (async () => {
          const ok = await loadFontFace(font.cssFamily, font.resolvedUrl!, {
            weight: font.fontWeight,
            style: font.fontStyle,
          });
          const status = ok ? measureThaanaSupport(font.cssFamily) : "failed_to_load";
          await updateFont({
            fontId: font._id as Id<"dhivehi_fonts">,
            glyphValidationStatus: status,
          }).catch(() => {});
        })();
      } else if (font.resolvedUrl && font.glyphValidationStatus !== "failed_to_load") {
        // keep active fonts loaded for previews
        void loadFontFace(font.cssFamily, font.resolvedUrl, {
          weight: font.fontWeight,
          style: font.fontStyle,
        });
      }
    }
  }, [fonts, updateFont]);

  const handleFilePick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = "." + formatFromName(file.name);
    if (!ACCEPTED.includes(ext)) {
      toast.error("Unsupported font format", {
        description: "Use WOFF2, WOFF, TTF or OTF.",
      });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Font file is too large (max 6MB).");
      return;
    }
    setPendingFile(file);
    setForm((f) => ({
      ...f,
      displayName: f.displayName || file.name.replace(/\.[^.]+$/, ""),
    }));
  };

  const handleRegister = async () => {
    if (!pendingFile || !form.displayName.trim()) {
      toast.error("Add a font file and a display name.");
      return;
    }
    if (!form.commercialUseConfirmed) {
      toast.error("Confirm the font is legally permitted for commercial use.");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": pendingFile.type || "font/woff2" },
        body: pendingFile,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: string };

      const cssFamily = `dv-${sanitizeName(form.displayName)}-${Date.now()
        .toString(36)
        .slice(-4)}`;

      await createFont({
        displayName: form.displayName.trim(),
        cssFamily,
        storageId,
        fileFormat: formatFromName(pendingFile.name),
        fontWeight: form.fontWeight,
        fontStyle: form.fontStyle,
        isVariable: form.isVariable,
        supportedUses: form.supportedUses,
        licenceName: form.licenceName || undefined,
        licenceNotes: form.licenceNotes || undefined,
        commercialUseConfirmed: form.commercialUseConfirmed,
        glyphValidationStatus: "unverified",
      });

      toast.success("Font uploaded — validating Thaana support...");
      setPendingFile(null);
      setForm({
        displayName: "",
        fontWeight: "400",
        fontStyle: "normal",
        isVariable: false,
        supportedUses: [],
        licenceName: "",
        licenceNotes: "",
        commercialUseConfirmed: false,
      });
    } catch (error) {
      toast.error("Could not register font", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleUse = (use: string) => {
    setForm((f) => ({
      ...f,
      supportedUses: f.supportedUses.includes(use)
        ? f.supportedUses.filter((u) => u !== use)
        : [...f.supportedUses, use],
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
          Settings
        </p>
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          Dhivehi Fonts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register legally permitted Thaana display fonts for the Dhivehi
          Composer. Fonts are validated for Thaana glyph support before they can
          be activated.
        </p>
        <Link
          to="/dhivehi-composer"
          className="text-xs text-primary hover:underline mt-2 inline-block"
        >
          Go to Dhivehi Composer &rarr;
        </Link>
      </div>

      {/* Upload / Register */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-heading font-semibold text-foreground">
          Register a font
        </h2>

        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={22} className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-foreground">
            {pendingFile ? pendingFile.name : "Click to select a font file"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            WOFF2 (preferred), WOFF, TTF, OTF — max 6MB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => handleFilePick(e.target.files)}
          />
        </div>

        {pendingFile && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display name *</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  placeholder="e.g. Faseyha Bold"
                />
              </div>
              <div className="space-y-2">
                <Label>Default weight</Label>
                <select
                  value={form.fontWeight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fontWeight: e.target.value }))
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {["300", "400", "500", "600", "700", "800", "900"].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isVariable}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isVariable: v }))
                }
                id="variable"
              />
              <Label htmlFor="variable" className="cursor-pointer">
                Variable font
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Supported uses</Label>
              <div className="flex flex-wrap gap-1.5">
                {FONT_SUPPORTED_USES.map((use) => (
                  <button
                    key={use}
                    type="button"
                    onClick={() => toggleUse(use)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs capitalize transition-all border",
                      form.supportedUses.includes(use)
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {use}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Licence name</Label>
                <Input
                  value={form.licenceName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, licenceName: e.target.value }))
                  }
                  placeholder="e.g. SIL OFL 1.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Licence notes</Label>
                <Textarea
                  rows={1}
                  value={form.licenceNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, licenceNotes: e.target.value }))
                  }
                  placeholder="Source / permitted use"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.commercialUseConfirmed}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    commercialUseConfirmed: e.target.checked,
                  }))
                }
                className="mt-0.5"
              />
              I confirm this font is legally permitted for commercial use by
              Musalhu.
            </label>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setPendingFile(null)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button onClick={handleRegister} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Uploading
                  </>
                ) : (
                  "Register font"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Registered fonts */}
      <div className="space-y-3">
        <h2 className="text-sm font-heading font-semibold text-foreground">
          Registered fonts
        </h2>

        {/* Built-in fallback */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-foreground">
                Noto Sans Thaana{" "}
                <span className="text-[10px] text-muted-foreground">
                  (built-in fallback)
                </span>
              </p>
              <StatusPill status="supported" />
            </div>
            <p
              dir="rtl"
              lang="dv"
              className="text-2xl text-foreground"
              style={{ fontFamily: THAANA_FALLBACK_STACK }}
            >
              {THAANA_SAMPLE}
            </p>
          </div>
        </div>

        {fonts === undefined ? (
          <Skeleton className="h-24 w-full" />
        ) : fonts.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/30 p-4">
            No custom fonts registered yet.
          </p>
        ) : (
          fonts.map((font) => (
            <div
              key={font._id}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {font.displayName}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={font.glyphValidationStatus} />
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {font.fileFormat} · {font.fontWeight}
                    </span>
                    {font.licenceName && (
                      <span className="text-[10px] text-muted-foreground">
                        {font.licenceName}
                      </span>
                    )}
                  </div>
                  {font.supportedUses && font.supportedUses.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {font.supportedUses.map((u) => (
                        <span
                          key={u}
                          className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground capitalize"
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={font.active}
                      disabled={
                        font.glyphValidationStatus === "failed_to_load" ||
                        font.glyphValidationStatus === "glyphs_unavailable"
                      }
                      onCheckedChange={async (v) => {
                        try {
                          await updateFont({
                            fontId: font._id as Id<"dhivehi_fonts">,
                            active: v,
                          });
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Update failed",
                          );
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {font.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={async () => {
                      await removeFont({
                        fontId: font._id as Id<"dhivehi_fonts">,
                      });
                      toast.success("Font removed");
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-md border border-border bg-background/50 p-4 space-y-2">
                <p
                  dir="rtl"
                  lang="dv"
                  className="text-3xl text-foreground leading-relaxed"
                  style={{
                    fontFamily: `"${font.cssFamily}", ${THAANA_FALLBACK_STACK}`,
                  }}
                >
                  {THAANA_SAMPLE}
                </p>
                <div
                  dir="rtl"
                  lang="dv"
                  className="text-lg text-muted-foreground"
                  style={{
                    fontFamily: `"${font.cssFamily}", ${THAANA_FALLBACK_STACK}`,
                  }}
                >
                  <span>{"އަގު "}</span>
                  <bdi dir="ltr">MVR 2,500</bdi>
                  <span className="mx-3" />
                  <span>{"ގުޅުއްވާ "}</span>
                  <bdi dir="ltr">+960 777 1234</bdi>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
