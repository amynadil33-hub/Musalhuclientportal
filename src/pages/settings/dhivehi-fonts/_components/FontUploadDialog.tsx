import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { uploadFontFile, deriveFormat } from "@/lib/dhivehi/upload.ts";
import { loadFont } from "@/lib/dhivehi/fonts.ts";
import { checkThaanaGlyphs } from "@/lib/dhivehi/glyph-check.ts";
import { UploadCloud, Loader2 } from "lucide-react";

const USE_OPTIONS = ["headline", "subheadline", "body", "price", "cta"] as const;

function slugFamily(name: string) {
  const base = name.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `dv-${base || "font"}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function FontUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const generateUploadUrl = useMutation(api.dhivehiFonts.generateUploadUrl);
  const createFont = useMutation(api.dhivehiFonts.create);
  const setValidation = useMutation(api.dhivehiFonts.setValidationStatus);

  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [licenceName, setLicenceName] = useState("");
  const [licenceNotes, setLicenceNotes] = useState("");
  const [commercial, setCommercial] = useState(false);
  const [uses, setUses] = useState<string[]>(["headline", "body"]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFile(null);
    setDisplayName("");
    setLicenceName("");
    setLicenceNotes("");
    setCommercial(false);
    setUses(["headline", "body"]);
  };

  const toggleUse = (u: string) =>
    setUses((prev) =>
      prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u],
    );

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f && !displayName) {
      setDisplayName(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Choose a font file first");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Give the font a display name");
      return;
    }
    setSubmitting(true);
    try {
      const fileFormat = deriveFormat(file.name);
      const cssFamily = slugFamily(displayName);
      const { storageId } = await uploadFontFile(file, generateUploadUrl);

      const fontId = await createFont({
        displayName: displayName.trim(),
        cssFamily,
        storageId,
        fileFormat,
        supportedUses: uses,
        licenceName: licenceName.trim() || undefined,
        licenceNotes: licenceNotes.trim() || undefined,
        commercialUseConfirmed: commercial,
      });

      // Validate glyph coverage against the freshly uploaded file.
      try {
        const url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const state = await loadFont({ cssFamily, fontUrl: url });
        if (state === "loaded") {
          await document.fonts.ready;
          const result = checkThaanaGlyphs(cssFamily);
          await setValidation({
            fontId,
            glyphValidationStatus: result.status,
          });
        } else {
          await setValidation({ fontId, glyphValidationStatus: "unavailable" });
        }
      } catch {
        // Non-fatal — card will offer a manual re-check.
      }

      toast.success("Font uploaded");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Dhivehi font</DialogTitle>
          <DialogDescription>
            Upload a licenced Thaana font (.woff2, .woff, .ttf, .otf). Glyph
            coverage is checked automatically after upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Font file</Label>
            <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-md py-6 cursor-pointer hover:border-primary/60 transition-colors">
              <UploadCloud size={20} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {file ? file.name : "Click to choose a font file"}
              </span>
              <input
                type="file"
                accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dv-font-name">Display name</Label>
            <Input
              id="dv-font-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. MV Faseyha"
            />
          </div>

          <div className="space-y-2">
            <Label>Intended uses</Label>
            <div className="flex flex-wrap gap-1.5">
              {USE_OPTIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => toggleUse(u)}
                  className={
                    "text-[11px] px-2 py-1 rounded border capitalize transition-colors " +
                    (uses.includes(u)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground")
                  }
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dv-lic">Licence name</Label>
              <Input
                id="dv-lic"
                value={licenceName}
                onChange={(e) => setLicenceName(e.target.value)}
                placeholder="e.g. SIL OFL 1.1"
              />
            </div>
            <div className="flex items-end gap-2 pb-1.5">
              <Switch
                id="dv-comm"
                checked={commercial}
                onCheckedChange={setCommercial}
              />
              <Label htmlFor="dv-comm" className="text-xs">
                Commercial use confirmed
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dv-lic-notes">Licence notes</Label>
            <Textarea
              id="dv-lic-notes"
              value={licenceNotes}
              onChange={(e) => setLicenceNotes(e.target.value)}
              placeholder="Where the licence is stored, restrictions, etc."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Uploading" : "Upload font"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
