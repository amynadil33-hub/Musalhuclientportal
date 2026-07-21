import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ArrowLeft, Save, Brain, Anchor, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type TabId = "overview" | "memory" | "anchors";

const TABS = [
  { id: "overview" as TabId, icon: ImageIcon, label: "Overview" },
  { id: "memory" as TabId, icon: Brain, label: "Creative Memory" },
  { id: "anchors" as TabId, icon: Anchor, label: "Anchors" },
];

const STATUS_OPTIONS = ["Draft", "Active", "Completed", "Archived"];
const PLATFORMS = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "Twitter"];

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const campaign = useQuery(api.campaigns.get, {
    campaignId: campaignId as Id<"campaigns">,
  });
  const updateCampaign = useMutation(api.campaigns.update);

  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const c = campaign;
  const getStr = (k: string) => (form?.[k] as string) ?? (c as Record<string, unknown> | null | undefined)?.[k] as string ?? "";
  const setField = (k: string, v: unknown) => setForm((prev) => ({ ...(c ?? {}), ...prev, [k]: v }));

  if (campaign === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="ghost" onClick={() => navigate("/campaigns")} className="mt-4 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCampaign({
        campaignId: campaignId as Id<"campaigns">,
        name: getStr("name") || campaign.name,
        objective: getStr("objective") || undefined,
        mainMessage: getStr("mainMessage") || undefined,
        slogan: getStr("slogan") || undefined,
        offer: getStr("offer") || undefined,
        cta: getStr("cta") || undefined,
        language: getStr("language") || undefined,
        visualDirection: getStr("visualDirection") || undefined,
        mood: getStr("mood") || undefined,
        colourTreatment: getStr("colourTreatment") || undefined,
        photographyStyle: getStr("photographyStyle") || undefined,
        videoMotionStyle: getStr("videoMotionStyle") || undefined,
        startDate: getStr("startDate") || undefined,
        endDate: getStr("endDate") || undefined,
        status: getStr("status") || campaign.status,
      });
      toast.success("Campaign saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-sidebar px-6 py-4">
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Campaigns
        </button>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-heading font-semibold text-foreground">{campaign.name}</h1>
            <p className="text-xs text-muted-foreground">{campaign.status}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate(`/image-studio?campaign=${campaignId}`)}>
              <ImageIcon size={13} className="mr-2" />
              Generate Image
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="border-b border-border bg-sidebar px-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all",
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Campaign Name</Label>
                  <Input value={getStr("name") || campaign.name} onChange={(e) => setField("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={getStr("status") || campaign.status}
                    onChange={(e) => setField("status", e.target.value)}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Input value={getStr("language")} onChange={(e) => setField("language", e.target.value)} placeholder="English, Dhivehi, Bilingual..." />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Campaign Objective</Label>
                  <Textarea value={getStr("objective")} onChange={(e) => setField("objective", e.target.value)} placeholder="What is this campaign trying to achieve?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Main Message</Label>
                  <Textarea value={getStr("mainMessage")} onChange={(e) => setField("mainMessage", e.target.value)} rows={2} placeholder="Core message to communicate..." />
                </div>
                <div className="space-y-2">
                  <Label>Slogan</Label>
                  <Input value={getStr("slogan")} onChange={(e) => setField("slogan", e.target.value)} placeholder="Campaign tagline..." />
                </div>
                <div className="space-y-2">
                  <Label>Offer</Label>
                  <Input value={getStr("offer")} onChange={(e) => setField("offer", e.target.value)} placeholder="Special offer or promotion..." />
                </div>
                <div className="space-y-2">
                  <Label>CTA</Label>
                  <Input value={getStr("cta")} onChange={(e) => setField("cta", e.target.value)} placeholder="Call to action..." />
                </div>
                <div className="space-y-2">
                  <Label>Visual Direction</Label>
                  <Textarea value={getStr("visualDirection")} onChange={(e) => setField("visualDirection", e.target.value)} rows={2} placeholder="Describe the visual style and feel..." />
                </div>
                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Input value={getStr("mood")} onChange={(e) => setField("mood", e.target.value)} placeholder="e.g. Aspirational, warm, luxurious..." />
                </div>
                <div className="space-y-2">
                  <Label>Colour Treatment</Label>
                  <Input value={getStr("colourTreatment")} onChange={(e) => setField("colourTreatment", e.target.value)} placeholder="e.g. Warm tones, muted palette..." />
                </div>
                <div className="space-y-2">
                  <Label>Photography Style</Label>
                  <Input value={getStr("photographyStyle")} onChange={(e) => setField("photographyStyle", e.target.value)} placeholder="e.g. Clean product shots, lifestyle..." />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={getStr("startDate")} onChange={(e) => setField("startDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={getStr("endDate")} onChange={(e) => setField("endDate", e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Campaign"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "memory" && (
            <CampaignMemoryTab campaignId={campaignId as Id<"campaigns">} />
          )}

          {activeTab === "anchors" && (
            <CampaignAnchorsTab campaignId={campaignId as Id<"campaigns">} />
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignMemoryTab({ campaignId }: { campaignId: Id<"campaigns"> }) {
  const memory = useQuery(api.campaigns.getMemory, { campaignId });
  const updateMemory = useMutation(api.campaigns.updateMemory);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const m = memory;
  const getStr = (k: string) => (form?.[k] as string) ?? (m as Record<string, unknown> | null | undefined)?.[k] as string ?? "";

  const setField = (k: string, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMemory({
        campaignId,
        masterPrompt: getStr("masterPrompt") || undefined,
        visualDirection: getStr("visualDirection") || undefined,
        negativeInstructions: getStr("negativeInstructions") || undefined,
        preferredLighting: getStr("preferredLighting") || undefined,
        environment: getStr("environment") || undefined,
        cameraStyle: getStr("cameraStyle") || undefined,
        teamNotes: getStr("teamNotes") || undefined,
      });
      toast.success("Campaign memory saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (memory === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-heading font-semibold text-foreground mb-1">Campaign Creative Memory</h2>
        <p className="text-xs text-muted-foreground">
          This information is automatically included in every image and video generation for this campaign.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Master Prompt</Label>
          <Textarea
            value={getStr("masterPrompt")}
            onChange={(e) => setField("masterPrompt", e.target.value)}
            placeholder="Core visual description that defines this campaign's look and feel. This is prepended to every generation prompt..."
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>Visual Direction</Label>
          <Textarea
            value={getStr("visualDirection")}
            onChange={(e) => setField("visualDirection", e.target.value)}
            placeholder="Detailed visual direction for this campaign..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Negative Instructions (what to avoid)</Label>
          <Textarea
            value={getStr("negativeInstructions")}
            onChange={(e) => setField("negativeInstructions", e.target.value)}
            placeholder="Styles, elements, colours, or content to avoid in all generations..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Preferred Lighting</Label>
            <Input value={getStr("preferredLighting")} onChange={(e) => setField("preferredLighting", e.target.value)} placeholder="e.g. Warm architectural..." />
          </div>
          <div className="space-y-2">
            <Label>Environment</Label>
            <Input value={getStr("environment")} onChange={(e) => setField("environment", e.target.value)} placeholder="e.g. Modern kitchen..." />
          </div>
          <div className="space-y-2">
            <Label>Camera Style</Label>
            <Input value={getStr("cameraStyle")} onChange={(e) => setField("cameraStyle", e.target.value)} placeholder="e.g. Wide angle, product close-up..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Team Notes</Label>
          <Textarea
            value={getStr("teamNotes")}
            onChange={(e) => setField("teamNotes", e.target.value)}
            placeholder="Internal notes for the team about this campaign..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? "Saving..." : "Save Memory"}
        </Button>
      </div>
    </div>
  );
}

function CampaignAnchorsTab({ campaignId }: { campaignId: Id<"campaigns"> }) {
  const anchors = useQuery(api.campaigns.getAnchors, { campaignId });
  const removeAnchor = useMutation(api.campaigns.removeAnchor);
  const navigate = useNavigate();

  const ANCHOR_LABELS: Record<string, string> = {
    primary: "Primary",
    style: "Style Ref",
    product: "Product Ref",
    environment: "Environment",
    character: "Character",
  };

  if (anchors === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground mb-1">Campaign Anchors</h2>
          <p className="text-xs text-muted-foreground">
            Approved reference images used to guide all future generations in this campaign.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate(`/image-studio?campaign=${campaignId}`)} className="gap-2">
          <ImageIcon size={13} />
          Generate & Add
        </Button>
      </div>

      {anchors.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
          <Anchor size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No anchors yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Generate images in the Image Studio and mark them as anchors
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {anchors.map((anchor) => (
            <div key={anchor._id} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
              <img src={anchor.imageUrl} alt={anchor.name ?? "Anchor"} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2">
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                  {ANCHOR_LABELS[anchor.anchorType] ?? anchor.anchorType}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="destructive" onClick={() => removeAnchor({ anchorId: anchor._id })}>
                  Remove
                </Button>
              </div>
              {anchor.name && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-2 py-1 truncate">
                  {anchor.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
