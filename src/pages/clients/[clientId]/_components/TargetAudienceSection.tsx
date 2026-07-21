import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder ?? "Type and press Enter..."}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full"
            >
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TargetAudienceSection({ clientId }: { clientId: Id<"clients"> }) {
  const audience = useQuery(api.targetAudiences.getByClient, { clientId });
  const upsert = useMutation(api.targetAudiences.upsert);

  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const a = audience;
  const getStr = (k: string) => (form?.[k] as string) ?? (a as Record<string, unknown> | null | undefined)?.[k] as string ?? "";
  const getArr = (k: string) => (form?.[k] as string[]) ?? (a as Record<string, unknown> | null | undefined)?.[k] as string[] ?? [];
  const setField = (k: string, v: unknown) =>
    setForm((prev) => ({
      location: a?.location ?? "",
      ageGroup: a?.ageGroup ?? "",
      customerType: a?.customerType ?? "",
      preferredLanguage: a?.preferredLanguage ?? "",
      culturalConsiderations: a?.culturalConsiderations ?? "",
      interests: a?.interests ?? [],
      buyerMotivations: a?.buyerMotivations ?? [],
      painPoints: a?.painPoints ?? [],
      campaignPlatforms: a?.campaignPlatforms ?? [],
      ...prev,
      [k]: v,
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert({
        clientId,
        location: getStr("location") || undefined,
        ageGroup: getStr("ageGroup") || undefined,
        customerType: getStr("customerType") || undefined,
        preferredLanguage: getStr("preferredLanguage") || undefined,
        culturalConsiderations: getStr("culturalConsiderations") || undefined,
        interests: getArr("interests").length ? getArr("interests") : undefined,
        buyerMotivations: getArr("buyerMotivations").length ? getArr("buyerMotivations") : undefined,
        painPoints: getArr("painPoints").length ? getArr("painPoints") : undefined,
        campaignPlatforms: getArr("campaignPlatforms").length ? getArr("campaignPlatforms") : undefined,
      });
      toast.success("Target audience saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (audience === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h2 className="text-base font-heading font-semibold text-foreground">Target Market</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={getStr("location")} onChange={(e) => setField("location", e.target.value)} placeholder="e.g. Maldives, Male City..." />
        </div>
        <div className="space-y-2">
          <Label>Age Group</Label>
          <Input value={getStr("ageGroup")} onChange={(e) => setField("ageGroup", e.target.value)} placeholder="e.g. 25-45" />
        </div>
        <div className="space-y-2">
          <Label>Customer Type</Label>
          <Input value={getStr("customerType")} onChange={(e) => setField("customerType", e.target.value)} placeholder="e.g. Homeowners, property developers..." />
        </div>
        <div className="space-y-2">
          <Label>Preferred Language</Label>
          <Input value={getStr("preferredLanguage")} onChange={(e) => setField("preferredLanguage", e.target.value)} placeholder="e.g. English, Dhivehi, bilingual..." />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>Cultural Considerations</Label>
          <Textarea value={getStr("culturalConsiderations")} onChange={(e) => setField("culturalConsiderations", e.target.value)} placeholder="Cultural nuances, religious considerations, local preferences..." rows={3} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TagInput label="Interests" values={getArr("interests")} onChange={(v) => setField("interests", v)} placeholder="e.g. Interior design, home improvement..." />
        <TagInput label="Buyer Motivations" values={getArr("buyerMotivations")} onChange={(v) => setField("buyerMotivations", v)} placeholder="e.g. Quality craftsmanship, resale value..." />
        <TagInput label="Pain Points" values={getArr("painPoints")} onChange={(v) => setField("painPoints", v)} placeholder="e.g. Finding reliable contractors..." />
        <TagInput label="Campaign Platforms" values={getArr("campaignPlatforms")} onChange={(v) => setField("campaignPlatforms", v)} placeholder="e.g. Instagram, Facebook, TikTok..." />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? "Saving..." : "Save Target Audience"}
        </Button>
      </div>
    </div>
  );
}
