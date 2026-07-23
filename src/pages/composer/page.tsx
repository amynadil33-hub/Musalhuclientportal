import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Type,
  Plus,
  LayoutTemplate,
  ImageIcon,
  Copy,
  Trash2,
} from "lucide-react";
import { OUTPUT_FORMATS } from "@/lib/dhivehi/constants.ts";
import { AD_TEMPLATES } from "@/lib/dhivehi/templates.ts";
import { applyTemplate } from "@/lib/dhivehi/applyTemplate.ts";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_TONE: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Needs Review": "bg-amber-500/15 text-amber-500",
  Approved: "bg-emerald-500/15 text-emerald-500",
  Exported: "bg-primary/15 text-primary",
};

export default function ComposerPage() {
  const navigate = useNavigate();
  const clients = useQuery(api.clients.list, {});
  const compositions = useQuery(api.dhivehiCompositions.list, {});
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
            Studio
          </p>
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Dhivehi Ad Composer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add authentic Dhivehi text to your ad visuals with full RTL support
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={16} className="mr-1.5" /> New Composition
        </Button>
      </div>

      {compositions === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
          ))}
        </div>
      ) : compositions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Type size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            No compositions yet. Create one to start adding Dhivehi text.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} className="mr-1.5" /> New Composition
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {compositions.map((c) => (
            <CompositionCard
              key={c._id}
              composition={c}
              clientName={
                clients?.find((cl) => cl._id === c.clientId)?.name ?? "—"
              }
              onOpen={() => navigate(`/composer/${c._id}`)}
            />
          ))}
        </div>
      )}

      <NewCompositionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => navigate(`/composer/${id}`)}
      />
    </div>
  );
}

function CompositionCard({
  composition,
  clientName,
  onOpen,
}: {
  composition: {
    _id: Id<"dhivehi_compositions">;
    title: string;
    status: string;
    backgroundUrl?: string;
    backgroundColor?: string;
    canvasWidth: number;
    canvasHeight: number;
    _creationTime: number;
  };
  clientName: string;
  onOpen: () => void;
}) {
  const duplicate = useMutation(api.dhivehiCompositions.duplicate);
  const archive = useMutation(api.dhivehiCompositions.archive);

  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all">
      <button
        onClick={onOpen}
        className="block w-full aspect-[4/5] bg-muted relative"
        style={{ backgroundColor: composition.backgroundColor ?? undefined }}
      >
        {composition.backgroundUrl ? (
          <img
            src={composition.backgroundUrl || "/placeholder.svg"}
            alt={composition.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Type size={32} className="text-muted-foreground/30" />
          </div>
        )}
        <span
          className={cn(
            "absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
            STATUS_TONE[composition.status] ?? STATUS_TONE.Draft,
          )}
        >
          {composition.status}
        </span>
      </button>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate">
          {composition.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {clientName} · {composition.canvasWidth}×{composition.canvasHeight}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground/60">
            {format(new Date(composition._creationTime), "d MMM yyyy")}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title="Duplicate"
              onClick={async () => {
                await duplicate({ compositionId: composition._id });
                toast.success("Composition duplicated");
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <Copy size={13} />
            </button>
            <button
              title="Archive"
              onClick={async () => {
                await archive({ compositionId: composition._id });
                toast.success("Composition archived");
              }}
              className="p-1 rounded text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewCompositionDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: Id<"dhivehi_compositions">) => void;
}) {
  const clients = useQuery(api.clients.list, {});
  const create = useMutation(api.dhivehiCompositions.create);
  const addLayer = useMutation(api.dhivehiCompositions.addLayer);

  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [formatId, setFormatId] = useState(OUTPUT_FORMATS[0].id);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);
  const [templateId, setTemplateId] = useState<string>("");
  const [sourceGenId, setSourceGenId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const images = useQuery(
    api.imageGenerations.listByClient,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip",
  );

  const sourceImages = useMemo(
    () =>
      images?.flatMap((g) =>
        (g.imageUrls ?? []).map((url) => ({ url, genId: g._id })),
      ) ?? [],
    [images],
  );

  const fmt = OUTPUT_FORMATS.find((f) => f.id === formatId)!;
  const width = fmt.id === "custom" ? customW : fmt.width;
  const height = fmt.id === "custom" ? customH : fmt.height;

  const reset = () => {
    setClientId("");
    setTitle("");
    setFormatId(OUTPUT_FORMATS[0].id);
    setTemplateId("");
    setSourceGenId("");
  };

  const handleCreate = async () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    setBusy(true);
    try {
      const selectedImage = sourceImages.find((s) => s.genId === sourceGenId);
      const compositionId = await create({
        clientId: clientId as Id<"clients">,
        title: title.trim() || "Untitled composition",
        canvasWidth: width,
        canvasHeight: height,
        outputFormat: fmt.id,
        safeAreaPreset: fmt.safeArea,
        backgroundUrl: selectedImage?.url,
        backgroundColor: selectedImage ? undefined : "#111111",
        sourceGenerationId: sourceGenId
          ? (sourceGenId as Id<"image_generations">)
          : undefined,
      });

      const template = AD_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        const layers = applyTemplate(template, width, height);
        let z = 1;
        for (const l of layers) {
          await addLayer({ compositionId, ...l, zIndex: z++ });
        }
      }
      toast.success("Composition created");
      reset();
      onClose();
      onCreated(compositionId);
    } catch (err) {
      console.log("[v0] create composition failed", err);
      toast.error("Could not create composition");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Composition</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setSourceGenId("");
                }}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select client…</option>
                {clients?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Eid Sale Post"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Output format</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OUTPUT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatId(f.id)}
                  className={cn(
                    "text-left px-3 py-2 rounded-md border text-xs transition-all",
                    formatId === f.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-input text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="block font-medium">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {f.id === "custom"
                      ? "Set dimensions"
                      : `${f.width}×${f.height} · ${f.ratio}`}
                  </span>
                </button>
              ))}
            </div>
            {fmt.id === "custom" && (
              <div className="flex gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <LayoutTemplate size={13} /> Template (optional)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setTemplateId("")}
                className={cn(
                  "px-3 py-2 rounded-md border text-xs transition-all",
                  templateId === ""
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-input text-muted-foreground hover:text-foreground",
                )}
              >
                Blank
              </button>
              {AD_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "px-3 py-2 rounded-md border text-xs transition-all",
                    templateId === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-input text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {clientId && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ImageIcon size={13} /> Background image (optional)
              </Label>
              {sourceImages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No generated images for this client. You can add a background
                  later.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                  {sourceImages.map((img, i) => (
                    <button
                      key={`${img.genId}-${i}`}
                      onClick={() =>
                        setSourceGenId(
                          sourceGenId === img.genId ? "" : img.genId,
                        )
                      }
                      className={cn(
                        "aspect-square rounded-md overflow-hidden border-2 transition-all",
                        sourceGenId === img.genId
                          ? "border-primary"
                          : "border-transparent hover:border-primary/40",
                      )}
                    >
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={busy || !clientId}>
            {busy ? "Creating…" : "Create & Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
