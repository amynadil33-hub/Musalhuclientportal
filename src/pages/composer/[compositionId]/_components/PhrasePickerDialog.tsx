import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PHRASE_CATEGORIES } from "@/lib/dhivehi/constants.ts";
import { cn } from "@/lib/utils.ts";
import { Search } from "lucide-react";

export function PhrasePickerDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (dhivehiText: string) => void;
}) {
  const phrases = useQuery(api.dhivehiPhrases.list, { status: "active" });
  const incrementUsage = useMutation(api.dhivehiPhrases.incrementUsage);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return (phrases ?? []).filter((p) => {
      if (category && p.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.englishMeaning.toLowerCase().includes(q) ||
        p.dhivehiText.includes(search)
      );
    });
  }, [phrases, search, category]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert saved phrase</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search phrases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border",
              category === ""
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            All
          </button>
          {PHRASE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border capitalize",
                category === c
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {phrases === undefined ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No matching phrases. Add phrases in the Phrase Library.
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p._id}
                onClick={async () => {
                  onPick(p.dhivehiText);
                  await incrementUsage({ phraseId: p._id }).catch(() => {});
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-muted transition-all"
              >
                <p
                  dir="rtl"
                  lang="dv"
                  className="font-thaana text-lg text-foreground"
                >
                  {p.dhivehiText}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {p.englishMeaning}
                  <span className="text-muted-foreground/50">
                    {" "}
                    · {p.category}
                  </span>
                </p>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
