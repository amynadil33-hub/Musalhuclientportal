import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { BookText, Search } from "lucide-react";

export default function PhrasePicker({
  onInsert,
}: {
  onInsert: (dhivehi: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const phrases = useQuery(
    api.dhivehiPhrases.list,
    open ? { search: search || undefined } : "skip",
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="secondary" className="h-7 text-[11px]">
          <BookText size={12} /> Phrases
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phrase library"
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-auto">
          {phrases === undefined ? (
            <p className="p-3 text-xs text-muted-foreground">Loading…</p>
          ) : phrases.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              No phrases found.
            </p>
          ) : (
            phrases.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  onInsert(p.dhivehiText);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border/50"
              >
                <p
                  dir="rtl"
                  lang="dv"
                  className="text-base text-foreground"
                  style={{ fontFamily: 'var(--font-thaana)' }}
                >
                  {p.dhivehiText}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {p.englishMeaning}
                  {p.category ? ` · ${p.category}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
