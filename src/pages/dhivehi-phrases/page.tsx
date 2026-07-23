import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { PHRASE_CATEGORIES } from "@/lib/dhivehi/presets.ts";
import PhraseDialog from "./_components/PhraseDialog.tsx";
import { cn } from "@/lib/utils.ts";
import { Plus, Search, BookText, Copy, Pencil, Archive } from "lucide-react";

export default function DhivehiPhrasesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"dhivehi_phrases"> | null>(null);

  const phrases = useQuery(api.dhivehiPhrases.list, {
    search: search || undefined,
    category: category || undefined,
  });
  const duplicate = useMutation(api.dhivehiPhrases.duplicate);
  const setArchived = useMutation(api.dhivehiPhrases.setArchived);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Doc<"dhivehi_phrases">) => {
    setEditing(p);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase">
            Dhivehi Composer
          </p>
          <h1 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-2">
            <BookText size={22} className="text-primary" />
            Phrase Library
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            A reusable, reviewed set of Dhivehi advertising phrases. Insert them
            straight into compositions from the composer.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={15} /> Add phrase
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search phrases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              category === ""
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {PHRASE_CATEGORIES.slice(0, 8).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {phrases === undefined ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : phrases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <BookText size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No phrases match your filter.
          </p>
          <Button onClick={openNew} variant="secondary">
            <Plus size={15} /> Add phrase
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {phrases.map((p) => (
            <div
              key={p._id}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p
                  dir="rtl"
                  lang="dv"
                  className="text-xl text-foreground leading-relaxed"
                  style={{ fontFamily: "var(--font-thaana)" }}
                >
                  {p.dhivehiText}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.englishMeaning}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex gap-1">
                  {p.category && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                      {p.category}
                    </span>
                  )}
                  {p.tone && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                      {p.tone}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                  Used {p.usageCount ?? 0}×
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openEdit(p)}
                >
                  <Pencil size={13} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={async () => {
                    await duplicate({ phraseId: p._id });
                    toast.success("Phrase duplicated");
                  }}
                >
                  <Copy size={13} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={async () => {
                    await setArchived({ phraseId: p._id, archived: true });
                    toast.success("Phrase archived");
                  }}
                >
                  <Archive size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PhraseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        phrase={editing}
      />
    </div>
  );
}
