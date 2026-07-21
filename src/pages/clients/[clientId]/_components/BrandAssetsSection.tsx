import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, FolderOpen } from "lucide-react";

const ASSET_TYPES = [
  { id: "logo", label: "Logos" },
  { id: "product_photo", label: "Product Photos" },
  { id: "business_photo", label: "Business Photos" },
  { id: "old_ad", label: "Old Advertisements" },
  { id: "mood_board", label: "Mood Boards" },
  { id: "visual_ref", label: "Visual References" },
  { id: "approved_gen", label: "Approved Generated" },
  { id: "video_clip", label: "Video Clips" },
];

export default function BrandAssetsSection({ clientId }: { clientId: Id<"clients"> }) {
  const assets = useQuery(api.brandAssets.listByClient, { clientId });
  const createAsset = useMutation(api.brandAssets.create);
  const removeAsset = useMutation(api.brandAssets.remove);
  const generateUploadUrl = useMutation(api.brandAssets.generateUploadUrl);

  const [activeType, setActiveType] = useState("logo");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets?.filter((a) => a.assetType === activeType) ?? [];

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json() as { storageId: string };
        // Get a URL for the storage ID
        const url = `https://api.convex.dev/storage/${storageId}`;
        await createAsset({
          clientId,
          assetType: activeType,
          url,
          storageId,
          name: file.name,
        });
      }
      toast.success("Assets uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: Id<"brand_assets">) => {
    await removeAsset({ assetId });
    toast.success("Asset removed");
  };

  if (assets === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-semibold text-foreground">Brand Assets</h2>
        <Button
          size="sm"
          className="gap-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ASSET_TYPES.map((t) => {
          const count = assets.filter((a) => a.assetType === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeType === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div
          className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No {ASSET_TYPES.find((t) => t.id === activeType)?.label.toLowerCase()} yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click to upload files</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset._id}
              className="group relative bg-muted rounded-lg overflow-hidden aspect-square border border-border"
            >
              {asset.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={asset.url}
                  alt={asset.name ?? "Asset"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <FolderOpen size={24} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center px-2 truncate w-full">
                    {asset.name ?? "File"}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(asset._id)}
                  className="gap-1"
                >
                  <Trash2 size={12} />
                  Remove
                </Button>
              </div>
              {asset.name && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {asset.name}
                </div>
              )}
            </div>
          ))}
          {/* Upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
          >
            <Upload size={20} />
            <span className="text-xs">Upload</span>
          </button>
        </div>
      )}
    </div>
  );
}
