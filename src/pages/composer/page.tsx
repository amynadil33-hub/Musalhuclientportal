"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NewCompositionDialog } from "./_components/NewCompositionDialog";
import { getFormat } from "@/lib/dhivehi/formats.ts";
import { Plus, Search, LayoutTemplate } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Needs Review": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Exported: "bg-primary/15 text-primary border-primary/30",
  Archived: "bg-muted text-muted-foreground/60",
};

export default function ComposerListPage() {
  const compositions = useQuery(api.dhivehiCompositions.list, {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!compositions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return compositions;
    return compositions.filter((c) => c.title.toLowerCase().includes(q));
  }, [compositions, search]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">
            Dhivehi Ad Composer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Compose right-to-left Thaana ad creative with brand-safe typography
            and platform-perfect exports.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="size-4" />
          New Composition
        </Button>
      </header>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search compositions"
          className="pl-9"
        />
      </div>

      {compositions === undefined ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
          <LayoutTemplate className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No compositions yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first Dhivehi ad to get started.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            New Composition
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => {
            const format = getFormat(c.outputFormat);
            const aspect = c.canvasWidth / c.canvasHeight;
            return (
              <Link
                key={c._id}
                to={`/composer/${c._id}`}
                className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/50"
              >
                <div
                  className="flex items-center justify-center overflow-hidden bg-muted"
                  style={{ aspectRatio: aspect }}
                >
                  {c.backgroundUrl ? (
                    <img
                      src={c.backgroundUrl || "/placeholder.svg"}
                      alt=""
                      className="size-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div
                      className="size-full"
                      style={{ background: c.backgroundColor ?? "#1a1a1a" }}
                    />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STATUS_STYLES[c.status] ?? ""}`}
                    >
                      {c.status}
                    </Badge>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {format?.label ?? "Custom"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NewCompositionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
