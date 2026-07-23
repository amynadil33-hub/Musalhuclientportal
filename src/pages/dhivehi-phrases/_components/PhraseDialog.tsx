import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { PHRASE_CATEGORIES, TONES } from "@/lib/dhivehi/presets.ts";
import { containsThaana } from "@/lib/dhivehi/validation.ts";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export default function PhraseDialog({
  open,
  onOpenChange,
  phrase,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phrase?: Doc<"dhivehi_phrases"> | null;
}) {
  const create = useMutation(api.dhivehiPhrases.create);
  const update = useMutation(api.dhivehiPhrases.update);

  const [english, setEnglish] = useState("");
  const [dhivehi, setDhivehi] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEnglish(phrase?.englishMeaning ?? "");
      setDhivehi(phrase?.dhivehiText ?? "");
      setCategory(phrase?.category ?? "");
      setTone(phrase?.tone ?? "");
      setNotes(phrase?.notes ?? "");
    }
  }, [open, phrase]);

  const handleSave = async () => {
    if (!english.trim() || !dhivehi.trim()) {
      toast.error("Both English meaning and Dhivehi text are required");
      return;
    }
    setBusy(true);
    try {
      if (phrase) {
        await update({
          phraseId: phrase._id,
          englishMeaning: english.trim(),
          dhivehiText: dhivehi.trim(),
          category: category || undefined,
          tone: tone || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Phrase updated");
      } else {
        await create({
          englishMeaning: english.trim(),
          dhivehiText: dhivehi.trim(),
          category: category || undefined,
          tone: tone || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Phrase added");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save phrase");
    } finally {
      setBusy(false);
    }
  };

  const noThaana = dhivehi.trim().length > 0 && !containsThaana(dhivehi);

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{phrase ? "Edit phrase" : "Add phrase"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="ph-en">English meaning</Label>
            <Input
              id="ph-en"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="e.g. Limited time offer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ph-dv">Dhivehi text</Label>
            <Textarea
              id="ph-dv"
              value={dhivehi}
              onChange={(e) => setDhivehi(e.target.value)}
              dir="rtl"
              lang="dv"
              rows={2}
              className="text-lg leading-relaxed"
              style={{ fontFamily: "var(--font-thaana)" }}
              placeholder="ދިވެހި ލިޔުއްވާ"
            />
            {noThaana && (
              <p className="flex items-center gap-1 text-[11px] text-amber-500">
                <AlertTriangle size={11} /> This text has no Thaana characters.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PHRASE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ph-notes">Notes</Label>
            <Textarea
              id="ph-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Usage guidance, dialect notes, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {phrase ? "Save changes" : "Add phrase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
