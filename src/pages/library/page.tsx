import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Library, Search, ImageIcon, Download, Anchor, Filter } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";

export default function GeneratedLibraryPage() {
  const clients = useQuery(api.clients.list, {});
  const [selectedClient, setSelectedClient] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");

  const images = useQuery(
    api.imageGenerations.listByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );

  const handleDownload = async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `musalhu-export-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const allImages = images?.flatMap((gen) =>
    (gen.imageUrls ?? []).map((url) => ({
      url,
      gen,
      createdAt: new Date(gen._creationTime),
    })),
  ) ?? [];

  const filtered = allImages.filter((item) =>
    !search ||
    item.gen.shortPrompt.toLowerCase().includes(search.toLowerCase()) ||
    item.gen.fullPrompt?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">Studio</p>
        <h1 className="text-2xl font-heading font-semibold text-foreground">Generated Library</h1>
        <p className="text-sm text-muted-foreground mt-1">All generated images and videos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground w-full sm:w-48"
        >
          <option value="">All Clients</option>
          {clients?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by prompt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input"
          />
        </div>

        <div className="flex gap-1.5">
          {(["all", "image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "All" : t === "image" ? "Images" : "Videos"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {!selectedClient ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Library size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Select a client to view their generated content</p>
        </div>
      ) : images === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <ImageIcon size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">No generated content yet for this client</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item, i) => (
            <div
              key={`${item.gen._id}-${i}`}
              className="group relative bg-muted rounded-lg overflow-hidden aspect-square border border-border hover:border-primary/40 transition-all"
            >
              <img
                src={item.url}
                alt="Generated"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Anchor badge */}
              {item.gen.isAnchor && (
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                    {item.gen.anchorType ?? "Anchor"}
                  </span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <p className="text-white text-[10px] line-clamp-2">{item.gen.shortPrompt}</p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[10px] h-6 px-2"
                      onClick={() => handleDownload(item.url)}
                    >
                      <Download size={10} className="mr-1" /> Save
                    </Button>
                    <span className="text-[9px] text-white/60 ml-auto self-center">
                      {format(item.createdAt, "d MMM")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} image{filtered.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </div>
  );
}
