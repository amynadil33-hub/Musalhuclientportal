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
import {
  Building2,
  Palette,
  Target,
  ShoppingBag,
  Image,
  Megaphone,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import BrandProfileSection from "./_components/BrandProfileSection.tsx";
import TargetAudienceSection from "./_components/TargetAudienceSection.tsx";
import ProductsSection from "./_components/ProductsSection.tsx";
import BrandAssetsSection from "./_components/BrandAssetsSection.tsx";
import CampaignsSection from "./_components/CampaignsSection.tsx";

type TabId = "basic" | "brand" | "audience" | "products" | "assets" | "campaigns";

const TABS: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: "basic", icon: Building2, label: "Basic Info" },
  { id: "brand", icon: Palette, label: "Brand Profile" },
  { id: "audience", icon: Target, label: "Target Market" },
  { id: "products", icon: ShoppingBag, label: "Products & Services" },
  { id: "assets", icon: Image, label: "Brand Assets" },
  { id: "campaigns", icon: Megaphone, label: "Campaigns" },
];

export default function ClientProjectPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("basic");

  const client = useQuery(api.clients.get, {
    clientId: clientId as Id<"clients">,
  });

  const updateClient = useMutation(api.clients.update);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize form from client
  const clientName = client?.name ?? "";
  const clientIndustry = client?.industry ?? "";

  if (client === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="ghost" onClick={() => navigate("/clients")} className="mt-4">
          <ArrowLeft size={14} className="mr-2" />
          Back to Clients
        </Button>
      </div>
    );
  }

  const handleSaveBasic = async () => {
    setSaving(true);
    try {
      await updateClient({
        clientId: clientId as Id<"clients">,
        name: name || clientName,
        industry: industry || clientIndustry,
      });
      toast.success("Client updated");
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
          onClick={() => navigate("/clients")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={12} />
          Clients
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
            <Building2 size={16} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-semibold text-foreground">
              {client.name}
            </h1>
            <p className="text-xs text-muted-foreground">{client.industry}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-sidebar px-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl">
          {activeTab === "basic" && (
            <BasicInfoTab
              client={client}
              clientId={clientId as Id<"clients">}
              name={name || clientName}
              setName={setName}
              industry={industry || clientIndustry}
              setIndustry={setIndustry}
              onSave={handleSaveBasic}
              saving={saving}
            />
          )}
          {activeTab === "brand" && (
            <BrandProfileSection clientId={clientId as Id<"clients">} />
          )}
          {activeTab === "audience" && (
            <TargetAudienceSection clientId={clientId as Id<"clients">} />
          )}
          {activeTab === "products" && (
            <ProductsSection clientId={clientId as Id<"clients">} />
          )}
          {activeTab === "assets" && (
            <BrandAssetsSection clientId={clientId as Id<"clients">} />
          )}
          {activeTab === "campaigns" && (
            <CampaignsSection clientId={clientId as Id<"clients">} />
          )}
        </div>
      </div>
    </div>
  );
}

function BasicInfoTab({
  client,
  clientId,
  name,
  setName,
  industry,
  setIndustry,
  onSave,
  saving,
}: {
  client: { name: string; industry: string };
  clientId: Id<"clients">;
  name: string;
  setName: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const brandProfile = useQuery(api.brandProfiles.getByClient, { clientId });
  const updateBrand = useMutation(api.brandProfiles.upsert);

  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const bp = brandProfile;
  const effectiveWebsite = website || bp?.website || "";
  const effectivePhone = phone || bp?.phone || "";
  const effectiveAddress = address || bp?.address || "";
  const effectiveDescription = description || bp?.businessDescription || "";
  const effectiveNotes = notes || bp?.notes || "";

  const handleSaveAll = async () => {
    onSave();
    try {
      await updateBrand({
        clientId,
        website: effectiveWebsite || undefined,
        phone: effectivePhone || undefined,
        address: effectiveAddress || undefined,
        businessDescription: effectiveDescription || undefined,
        notes: effectiveNotes || undefined,
      });
    } catch {
      toast.error("Failed to save brand info");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-heading font-semibold text-foreground mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={client.name}
            />
          </div>
          <div className="space-y-2">
            <Label>Business Niche / Industry</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder={client.industry}
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={effectiveWebsite}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={effectivePhone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+960..."
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Address</Label>
            <Input
              value={effectiveAddress}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Business address..."
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Business Description</Label>
            <Textarea
              value={effectiveDescription}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the business does, its key offerings and unique value..."
              rows={4}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={effectiveNotes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Team notes, client preferences, special instructions..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
