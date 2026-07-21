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
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
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
          className="text-sm"
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
              <button
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrandProfileSection({ clientId }: { clientId: Id<"clients"> }) {
  const brandProfile = useQuery(api.brandProfiles.getByClient, { clientId });
  const upsert = useMutation(api.brandProfiles.upsert);

  const [form, setForm] = useState<{
    brandPersonality: string;
    toneOfVoice: string;
    preferredPhotographyStyle: string;
    preferredLighting: string;
    preferredPeopleRepresentation: string;
    ctaStyle: string;
    primaryColors: string[];
    secondaryColors: string[];
    preferredFonts: string[];
    visualKeywords: string[];
    preferredEnvironments: string[];
    preferredMaterials: string[];
    stylesToAvoid: string[];
    colorsToAvoid: string[];
    wordsToUse: string[];
    wordsToAvoid: string[];
  } | null>(null);

  const [saving, setSaving] = useState(false);

  const bp = brandProfile;

  const getField = <K extends keyof NonNullable<typeof bp>>(key: K) => {
    if (form !== null) {
      const formKey = key as keyof typeof form;
      if (formKey in (form ?? {})) return (form as Record<string, unknown>)[formKey as string];
    }
    return bp?.[key];
  };

  const setField = (key: string, value: unknown) => {
    setForm((prev) => ({
      brandPersonality: bp?.brandPersonality ?? "",
      toneOfVoice: bp?.toneOfVoice ?? "",
      preferredPhotographyStyle: bp?.preferredPhotographyStyle ?? "",
      preferredLighting: bp?.preferredLighting ?? "",
      preferredPeopleRepresentation: bp?.preferredPeopleRepresentation ?? "",
      ctaStyle: bp?.ctaStyle ?? "",
      primaryColors: bp?.primaryColors ?? [],
      secondaryColors: bp?.secondaryColors ?? [],
      preferredFonts: bp?.preferredFonts ?? [],
      visualKeywords: bp?.visualKeywords ?? [],
      preferredEnvironments: bp?.preferredEnvironments ?? [],
      preferredMaterials: bp?.preferredMaterials ?? [],
      stylesToAvoid: bp?.stylesToAvoid ?? [],
      colorsToAvoid: bp?.colorsToAvoid ?? [],
      wordsToUse: bp?.wordsToUse ?? [],
      wordsToAvoid: bp?.wordsToAvoid ?? [],
      ...prev,
      [key]: value,
    }));
  };

  const getStr = (key: string) =>
    (form as Record<string, unknown> | null)?.[key] as string ??
    (bp as Record<string, unknown> | null | undefined)?.[key] as string ?? "";

  const getArr = (key: string) =>
    (form as Record<string, unknown> | null)?.[key] as string[] ??
    (bp as Record<string, unknown> | null | undefined)?.[key] as string[] ?? [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert({
        clientId,
        brandPersonality: getStr("brandPersonality") || undefined,
        toneOfVoice: getStr("toneOfVoice") || undefined,
        preferredPhotographyStyle: getStr("preferredPhotographyStyle") || undefined,
        preferredLighting: getStr("preferredLighting") || undefined,
        preferredPeopleRepresentation: getStr("preferredPeopleRepresentation") || undefined,
        ctaStyle: getStr("ctaStyle") || undefined,
        primaryColors: getArr("primaryColors").length ? getArr("primaryColors") : undefined,
        secondaryColors: getArr("secondaryColors").length ? getArr("secondaryColors") : undefined,
        preferredFonts: getArr("preferredFonts").length ? getArr("preferredFonts") : undefined,
        visualKeywords: getArr("visualKeywords").length ? getArr("visualKeywords") : undefined,
        preferredEnvironments: getArr("preferredEnvironments").length ? getArr("preferredEnvironments") : undefined,
        preferredMaterials: getArr("preferredMaterials").length ? getArr("preferredMaterials") : undefined,
        stylesToAvoid: getArr("stylesToAvoid").length ? getArr("stylesToAvoid") : undefined,
        colorsToAvoid: getArr("colorsToAvoid").length ? getArr("colorsToAvoid") : undefined,
        wordsToUse: getArr("wordsToUse").length ? getArr("wordsToUse") : undefined,
        wordsToAvoid: getArr("wordsToAvoid").length ? getArr("wordsToAvoid") : undefined,
      });
      toast.success("Brand profile saved");
    } catch {
      toast.error("Failed to save brand profile");
    } finally {
      setSaving(false);
    }
  };

  if (bp === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-8">
      <h2 className="text-base font-heading font-semibold text-foreground">Brand Profile</h2>

      {/* Colours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TagInput
          label="Primary Colours"
          values={getArr("primaryColors")}
          onChange={(v) => setField("primaryColors", v)}
          placeholder="e.g. #8B6914 or Walnut Brown"
        />
        <TagInput
          label="Secondary Colours"
          values={getArr("secondaryColors")}
          onChange={(v) => setField("secondaryColors", v)}
          placeholder="e.g. Cream White"
        />
      </div>

      {/* Fonts */}
      <TagInput
        label="Preferred Fonts"
        values={getArr("preferredFonts")}
        onChange={(v) => setField("preferredFonts", v)}
        placeholder="e.g. Playfair Display"
      />

      {/* Personality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand Personality</Label>
          <Textarea
            value={getStr("brandPersonality")}
            onChange={(e) => setField("brandPersonality", e.target.value)}
            placeholder="e.g. Premium, modern, trustworthy, crafted with care..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Tone of Voice</Label>
          <Textarea
            value={getStr("toneOfVoice")}
            onChange={(e) => setField("toneOfVoice", e.target.value)}
            placeholder="e.g. Confident, warm, professional, aspirational..."
            rows={3}
          />
        </div>
      </div>

      {/* Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TagInput
          label="Visual Keywords"
          values={getArr("visualKeywords")}
          onChange={(v) => setField("visualKeywords", v)}
          placeholder="e.g. Minimal, warm, architectural..."
        />
        <TagInput
          label="Preferred Environments"
          values={getArr("preferredEnvironments")}
          onChange={(v) => setField("preferredEnvironments", v)}
          placeholder="e.g. Modern kitchen, living room..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preferred Photography Style</Label>
          <Input
            value={getStr("preferredPhotographyStyle")}
            onChange={(e) => setField("preferredPhotographyStyle", e.target.value)}
            placeholder="e.g. Realistic, clean, high contrast..."
          />
        </div>
        <div className="space-y-2">
          <Label>Preferred Lighting</Label>
          <Input
            value={getStr("preferredLighting")}
            onChange={(e) => setField("preferredLighting", e.target.value)}
            placeholder="e.g. Warm architectural lighting..."
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Style</Label>
          <Input
            value={getStr("ctaStyle")}
            onChange={(e) => setField("ctaStyle", e.target.value)}
            placeholder="e.g. Bold, direct action verbs..."
          />
        </div>
        <div className="space-y-2">
          <Label>Preferred People / Audience Representation</Label>
          <Input
            value={getStr("preferredPeopleRepresentation")}
            onChange={(e) => setField("preferredPeopleRepresentation", e.target.value)}
            placeholder="e.g. Maldivian families, couples..."
          />
        </div>
      </div>

      <TagInput
        label="Preferred Materials"
        values={getArr("preferredMaterials")}
        onChange={(v) => setField("preferredMaterials", v)}
        placeholder="e.g. Walnut wood, cream stone..."
      />

      {/* Avoid */}
      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">Elements to Avoid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TagInput
            label="Styles to Avoid"
            values={getArr("stylesToAvoid")}
            onChange={(v) => setField("stylesToAvoid", v)}
            placeholder="e.g. Cluttered, cheap-looking..."
          />
          <TagInput
            label="Colours to Avoid"
            values={getArr("colorsToAvoid")}
            onChange={(v) => setField("colorsToAvoid", v)}
            placeholder="e.g. Neon green, bright red..."
          />
          <TagInput
            label="Words to Use"
            values={getArr("wordsToUse")}
            onChange={(v) => setField("wordsToUse", v)}
            placeholder="e.g. Crafted, premium, bespoke..."
          />
          <TagInput
            label="Words to Avoid"
            values={getArr("wordsToAvoid")}
            onChange={(v) => setField("wordsToAvoid", v)}
            placeholder="e.g. Cheap, discount, basic..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? "Saving..." : "Save Brand Profile"}
        </Button>
      </div>
    </div>
  );
}
