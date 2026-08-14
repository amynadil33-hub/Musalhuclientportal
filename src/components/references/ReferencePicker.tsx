import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { ImageIcon, MoveDown, MoveUp, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  normalizeReferences,
  REFERENCE_ROLES,
  ROLE_LABELS,
  STRENGTH_LABELS,
  type ReferenceRole,
  type SelectedReferenceImage,
} from "@/lib/reference-images.ts";
import { cn } from "@/lib/utils.ts";

type LibraryItem = {
  key: string;
  sourceType: string;
  sourceId?: string;
  storageId?: string;
  url: string;
  label: string;
  group: string;
  suggestedRole: string;
};

export function ReferencePicker({
  clientId,
  campaignId,
  value,
  onChange,
  roles = REFERENCE_ROLES,
  title = "Reference Images",
  compact = false,
}: {
  clientId: Id<"clients">;
  campaignId?: Id<"campaigns">;
  value: SelectedReferenceImage[];
  onChange: (references: SelectedReferenceImage[]) => void;
  roles?: readonly ReferenceRole[];
  title?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [savingSet, setSavingSet] = useState(false);
  const [setTitle, setSetTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const library = useQuery(api.referenceImages.library, { clientId, campaignId });
  const sets = useQuery(
    api.referenceImages.listSets,
    campaignId ? { campaignId } : "skip",
  );
  const saveSet = useMutation(api.referenceImages.saveSet);
  const generateUploadUrl = useMutation(api.brandAssets.generateUploadUrl);
  const createUploaded = useMutation(api.brandAssets.createUploaded);

  const filtered = useMemo(
    () =>
      ((library ?? []) as LibraryItem[]).filter((item) => {
        const matchesSearch = !search || `${item.label} ${item.group}`.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || item.suggestedRole === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [library, roleFilter, search],
  );
  const groups = [...new Set(filtered.map((item) => item.group))];

  const update = (references: SelectedReferenceImage[]) => onChange(normalizeReferences(references));
  const select = (item: LibraryItem) => {
    if (value.some((reference) => reference.sourceType === item.sourceType && reference.sourceId === item.sourceId && reference.url === item.url)) return;
    if (value.length >= 8) {
      toast.error("A maximum of 8 reference images is supported");
      return;
    }
    const suggested = REFERENCE_ROLES.includes(item.suggestedRole as ReferenceRole)
      ? (item.suggestedRole as ReferenceRole)
      : roles[0];
    update([...value, {
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      storageId: item.storageId,
      url: item.url,
      label: item.label,
      role: roles.includes(suggested) ? suggested : roles[0],
      strength: "medium",
      isPrimary: value.length === 0,
      sortOrder: value.length,
    }]);
  };
  const patch = (index: number, fields: Partial<SelectedReferenceImage>) =>
    update(value.map((reference, itemIndex) => itemIndex === index ? { ...reference, ...fields } : reference));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...value];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    update(next);
  };
  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 15 * 1024 * 1024) return toast.error("Reference images must be smaller than 15 MB");
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json() as { storageId: string };
      await createUploaded({ clientId, assetType: "visual_ref", storageId, name: file.name });
      toast.success("Reference uploaded to the client library");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const handleSaveSet = async () => {
    if (!campaignId) return toast.error("Select a campaign before saving a set");
    if (!setTitle.trim()) return toast.error("Enter a set title");
    await saveSet({ clientId, campaignId, title: setTitle.trim(), referenceImages: normalizeReferences(value) });
    setSetTitle("");
    setSavingSet(false);
    toast.success("Reference set saved");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{title}</Label>
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)}>
          <Plus size={12} /> Add references
        </Button>
      </div>
      {!value.length ? (
        <button type="button" onClick={() => setOpen(true)} className="w-full rounded-md border border-dashed border-border p-3 text-left text-xs text-muted-foreground hover:border-primary/50">
          Add campaign anchors, products, approved ads, photos, or moodboards
        </button>
      ) : (
        <div className={cn("space-y-2", compact && "grid grid-cols-2 gap-2 space-y-0")}>
          {value.map((reference, index) => (
            <div key={`${reference.sourceType}:${reference.sourceId}:${reference.url}`} className="rounded-md border border-border bg-card p-2">
              <div className="flex gap-2">
                <div className="relative shrink-0">
                  {reference.url ? <img src={reference.url} alt={reference.label ?? "Reference"} className="h-12 w-12 rounded object-cover" onError={(event) => { event.currentTarget.style.opacity = "0.25"; }} /> : <div className="h-12 w-12 rounded bg-muted flex items-center justify-center"><ImageIcon size={15} /></div>}
                  {reference.isPrimary && <Star size={13} className="absolute -right-1 -top-1 fill-primary text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{reference.label ?? "Reference image"}</p>
                  <div className="mt-1 flex gap-1">
                    <select value={reference.role} onChange={(event) => patch(index, { role: event.target.value as ReferenceRole })} className="min-w-0 flex-1 rounded border border-border bg-input px-1 py-1 text-[10px]">
                      {roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                    </select>
                    <select value={reference.strength} onChange={(event) => patch(index, { strength: event.target.value as SelectedReferenceImage["strength"] })} className="min-w-0 flex-1 rounded border border-border bg-input px-1 py-1 text-[10px]">
                      {Object.entries(STRENGTH_LABELS).map(([strength, label]) => <option key={strength} value={strength}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" title="Make primary" onClick={() => update(value.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })))} className="p-1 text-muted-foreground hover:text-primary"><Star size={12} /></button>
                  <button type="button" title="Remove" onClick={() => update(value.filter((_, itemIndex) => itemIndex !== index))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                </div>
              </div>
              {!compact && <div className="mt-2 flex gap-1">
                <Input value={reference.notes ?? ""} onChange={(event) => patch(index, { notes: event.target.value || undefined })} placeholder="Optional preservation notes" className="h-7 text-[10px]" />
                <button type="button" aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0} className="px-1 text-muted-foreground disabled:opacity-20"><MoveUp size={12} /></button>
                <button type="button" aria-label="Move down" onClick={() => move(index, 1)} disabled={index === value.length - 1} className="px-1 text-muted-foreground disabled:opacity-20"><MoveDown size={12} /></button>
              </div>}
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && campaignId && <div className="flex gap-1">
        {savingSet ? <><Input value={setTitle} onChange={(event) => setSetTitle(event.target.value)} placeholder="Reference set title" className="h-7 text-xs" /><Button type="button" size="sm" className="h-7" onClick={handleSaveSet}>Save</Button></> : <Button type="button" size="sm" variant="ghost" className="h-7 px-1 text-[10px] text-primary" onClick={() => setSavingSet(true)}>Save selection as campaign set</Button>}
      </div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>Reference Image Library</DialogTitle></DialogHeader>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-52 flex-1"><Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search references" className="pl-9" /></div>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-md border border-border bg-input px-3 text-sm"><option value="all">All types</option>{roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file); }} />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload size={14} /> {uploading ? "Uploading…" : "Upload"}</Button>
          </div>
          {sets && sets.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Saved campaign sets</p><div className="flex flex-wrap gap-2">{sets.map((set) => <Button key={set._id} type="button" size="sm" variant="secondary" onClick={() => { update(set.referenceImages as SelectedReferenceImage[]); setOpen(false); }}>{set.title} · {set.referenceImages.length}</Button>)}</div></div>}
          {library === undefined ? <p className="py-12 text-center text-sm text-muted-foreground">Loading reference library…</p> : filtered.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No matching references. Upload an image to add one.</p> : groups.map((group) => <section key={group} className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{group}</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">{filtered.filter((item) => item.group === group).map((item) => { const selected = value.some((reference) => reference.url === item.url && reference.sourceId === item.sourceId); return <button key={item.key} type="button" onClick={() => select(item)} className={cn("overflow-hidden rounded-md border bg-card text-left", selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50")}><img src={item.url} alt={item.label} className="aspect-square w-full object-cover" /><p className="truncate p-1 text-[10px]">{item.label}</p></button>; })}</div></section>)}
          <DialogFooter><span className="mr-auto text-xs text-muted-foreground">{value.length}/8 selected</span><Button type="button" onClick={() => setOpen(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
