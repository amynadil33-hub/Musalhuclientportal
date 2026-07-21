import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import {
  ImageIcon,
  Wand2,
  Download,
  Anchor,
  Star,
  RefreshCw,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { cn } from "@/lib/utils.ts";

const FORMATS = [
  { id: "1024x1024", label: "Square 1:1", ratio: "aspect-square" },
  { id: "1024x1536", label: "Portrait 4:5 / 9:16", ratio: "aspect-[9/16]" },
  { id: "1536x1024", label: "Landscape 16:9", ratio: "aspect-[16/9]" },
];

const QUALITY = ["standard", "hd"];
const ANCHOR_TYPES = [
  "primary",
  "style",
  "product",
  "environment",
  "character",
];

function getGenerationErrorMessage(error: unknown) {
  let message = error instanceof Error ? error.message : "";

  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "message" in data) {
      const dataMessage = data.message;
      if (typeof dataMessage === "string") message = dataMessage;
    }
  }

  return (
    message.replace(/^.*Uncaught (?:ConvexError|Error):\s*/s, "").trim() ||
    "Image generation failed."
  );
}

export default function ImageStudioPage() {
  const [searchParams] = useSearchParams();
  const preselectedCampaign = searchParams.get("campaign");

  const clients = useQuery(api.clients.list, {});

  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>(
    preselectedCampaign ?? "",
  );
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>([]);
  const [platform, setPlatform] = useState("Instagram Portrait 4:5");
  const [format, setFormat] = useState("1024x1536");
  const [quality, setQuality] = useState("standard");
  const [numImages, setNumImages] = useState(2);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAnchorDialog, setShowAnchorDialog] = useState(false);
  const [anchorType, setAnchorType] = useState("primary");

  const campaigns = useQuery(
    api.campaigns.listByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );
  const products = useQuery(
    api.products.listByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );
  const anchors = useQuery(
    api.campaigns.getAnchors,
    selectedCampaign
      ? { campaignId: selectedCampaign as Id<"campaigns"> }
      : "skip",
  );
  const brandProfile = useQuery(
    api.brandProfiles.getByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );
  const targetAudience = useQuery(
    api.targetAudiences.getByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );
  const campaignData = useQuery(
    api.campaigns.get,
    selectedCampaign
      ? { campaignId: selectedCampaign as Id<"campaigns"> }
      : "skip",
  );
  const campaignMemory = useQuery(
    api.campaigns.getMemory,
    selectedCampaign
      ? { campaignId: selectedCampaign as Id<"campaigns"> }
      : "skip",
  );

  const generateImages = useAction(api.ai.imageGeneration.generateImages);
  const composePrompt = useAction(api.ai.imageGeneration.composePrompt);
  const createGeneration = useMutation(api.imageGenerations.create);
  const updateResult = useMutation(api.imageGenerations.updateResult);
  const addAnchor = useMutation(api.campaigns.addAnchor);
  const markAsAnchor = useMutation(api.imageGenerations.markAsAnchor);
  const recordUsage = useMutation(api.settings.record);

  // Auto-select first client if only one
  useEffect(() => {
    if (clients?.length === 1 && !selectedClient) {
      setSelectedClient(clients[0]._id);
    }
  }, [clients]);

  const handleGenerate = async () => {
    if (!selectedClient || !prompt.trim()) {
      toast.error("Please select a client and enter a prompt");
      return;
    }
    setGenerating(true);
    setGeneratedImages([]);

    let generationId: Id<"image_generations"> | null = null;
    try {
      // Build brand context
      const brandContext = brandProfile
        ? `Colors: ${brandProfile.primaryColors?.join(", ")}. Tone: ${brandProfile.toneOfVoice}. Style: ${brandProfile.preferredPhotographyStyle}. Lighting: ${brandProfile.preferredLighting}. Keywords: ${brandProfile.visualKeywords?.join(", ")}.`
        : "";

      const audienceContext = targetAudience
        ? `Target: ${targetAudience.customerType}, ${targetAudience.ageGroup}, ${targetAudience.location}.`
        : "";

      const campaignContext = campaignData
        ? `Campaign: ${campaignData.name}. Objective: ${campaignData.objective}. Mood: ${campaignData.mood}. Message: ${campaignData.mainMessage}.`
        : "";

      const memoryContext = campaignMemory
        ? `${campaignMemory.masterPrompt ?? ""} ${campaignMemory.visualDirection ?? ""} Environment: ${campaignMemory.environment ?? ""}. Camera: ${campaignMemory.cameraStyle ?? ""}.`
        : "";

      const avoidContext = brandProfile
        ? `Avoid: ${brandProfile.stylesToAvoid?.join(", ")}, ${brandProfile.colorsToAvoid?.join(", ")}, ${brandProfile.wordsToAvoid?.join(", ")}.`
        : (campaignMemory?.negativeInstructions ?? "");

      const productObj = products?.find((p) => p._id === selectedProduct);
      const productContext = productObj
        ? `Product: ${productObj.name}. ${productObj.description ?? ""}. Benefits: ${productObj.benefits?.join(", ") ?? ""}.`
        : "";

      // Compose full prompt
      const { fullPrompt } = await composePrompt({
        brandProfile: brandContext || undefined,
        targetAudience: audienceContext || undefined,
        campaignInfo: campaignContext || undefined,
        campaignMemory: memoryContext || undefined,
        selectedProduct: productContext || undefined,
        platform: `${platform} (${format})`,
        staffInstruction: prompt,
        avoidList: avoidContext || undefined,
      });

      // Create generation record
      generationId = await createGeneration({
        clientId: selectedClient as Id<"clients">,
        campaignId: selectedCampaign
          ? (selectedCampaign as Id<"campaigns">)
          : undefined,
        productId: selectedProduct
          ? (selectedProduct as Id<"products_services">)
          : undefined,
        shortPrompt: prompt,
        fullPrompt,
        platform,
        format,
        quality,
        provider: "openai",
      });

      // Generate
      const { urls } = await generateImages({
        prompt: fullPrompt,
        n: numImages,
        quality: quality === "hd" ? "hd" : "standard",
        size: format,
      });

      setGeneratedImages(urls);
      setSelectedImage(urls[0] ?? null);

      await updateResult({
        generationId,
        imageUrls: urls,
        status: "completed",
        estimatedCost: numImages * (quality === "hd" ? 0.211 : 0.053),
      });

      // Record usage
      await recordUsage({
        clientId: selectedClient as Id<"clients">,
        campaignId: selectedCampaign
          ? (selectedCampaign as Id<"campaigns">)
          : undefined,
        type: "image",
        provider: "openai",
        quality,
        numOutputs: urls.length,
        estimatedCost: numImages * (quality === "hd" ? 0.211 : 0.053),
        success: true,
      });

      toast.success(
        `${urls.length} image${urls.length > 1 ? "s" : ""} generated`,
      );
    } catch (error) {
      if (generationId) {
        await updateResult({ generationId, status: "failed" }).catch(() => {});
      }
      toast.error(getGenerationErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAnchor = async () => {
    if (!selectedImage || !selectedCampaign) return;
    try {
      await addAnchor({
        campaignId: selectedCampaign as Id<"campaigns">,
        imageUrl: selectedImage,
        anchorType,
        name: `${anchorType} anchor`,
      });
      toast.success("Marked as campaign anchor");
      setShowAnchorDialog(false);
    } catch {
      toast.error("Failed to mark as anchor");
    }
  };

  const handleDownload = async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `musalhu-gen-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-sidebar overflow-y-auto shrink-0">
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
              Studio
            </p>
            <h1 className="text-lg font-heading font-semibold text-foreground">
              Image Studio
            </h1>
          </div>

          {/* Client Select */}
          <div className="space-y-2">
            <Label>Client *</Label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedCampaign("");
                setSelectedProduct("");
              }}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select client...</option>
              {clients?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Select */}
          <div className="space-y-2">
            <Label>Campaign</Label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              disabled={!selectedClient}
            >
              <option value="">No campaign selected</option>
              {campaigns?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedCampaign && campaignMemory?.masterPrompt && (
              <p className="text-[10px] text-primary/80 bg-primary/5 border border-primary/20 rounded px-2 py-1">
                Campaign memory active — brand context auto-applied
              </p>
            )}
          </div>

          {/* Product Select */}
          <div className="space-y-2">
            <Label>Product / Service</Label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              disabled={!selectedClient}
            >
              <option value="">No product selected</option>
              {products
                ?.filter((p) => p.isActive)
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Anchors */}
          {selectedCampaign && anchors && anchors.length > 0 && (
            <div className="space-y-2">
              <Label>Campaign Anchors (reference images)</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {anchors.map((anchor) => (
                  <button
                    key={anchor._id}
                    onClick={() =>
                      setSelectedAnchors((prev) =>
                        prev.includes(anchor._id)
                          ? prev.filter((a) => a !== anchor._id)
                          : [...prev, anchor._id],
                      )
                    }
                    className={cn(
                      "aspect-square rounded overflow-hidden border-2 transition-all",
                      selectedAnchors.includes(anchor._id)
                        ? "border-primary"
                        : "border-border",
                    )}
                  >
                    <img
                      src={anchor.imageUrl}
                      alt="Anchor"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {selectedAnchors.length > 0 && (
                <p className="text-[10px] text-primary/80">
                  {selectedAnchors.length} anchor(s) selected
                </p>
              )}
            </div>
          )}

          {/* Format */}
          <div className="space-y-2">
            <Label>Platform & Format</Label>
            <div className="space-y-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md border text-sm transition-all",
                    format === f.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "border border-current rounded shrink-0",
                      f.ratio,
                      "w-4",
                    )}
                  />
                  {f.label}
                  {format === f.id && <Check size={13} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quality & Count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quality</Label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Variations</Label>
              <select
                value={numImages}
                onChange={(e) => setNumImages(Number(e.target.value))}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value={1}>1 image</option>
                <option value={2}>2 images</option>
                <option value={3}>3 images</option>
                <option value={4}>4 images</option>
              </select>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>Your Instruction *</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create. The system will automatically combine this with brand profile and campaign memory..."
              rows={4}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Keep it short — the system auto-expands with brand context
            </p>
          </div>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedClient || !prompt.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {generating ? (
              <>
                <Spinner />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate Images
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 overflow-auto bg-background">
        {generatedImages.length === 0 && !generating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ImageIcon size={24} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Select a client and enter a prompt to generate images
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-sm">
                Brand profile and campaign memory will be automatically applied
                to create consistent, on-brand visuals
              </p>
            </div>
          </div>
        ) : generating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Spinner />
              <p className="text-sm text-muted-foreground">
                Composing brand-aware prompt and generating images...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Generated grid */}
            <div
              className={cn(
                "grid gap-4",
                generatedImages.length === 1
                  ? "grid-cols-1 max-w-md"
                  : "grid-cols-2",
              )}
            >
              {generatedImages.map((url, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(url)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 cursor-pointer group transition-all",
                    selectedImage === url
                      ? "border-primary"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <img
                    src={url}
                    alt={`Generated ${i + 1}`}
                    className="w-full"
                  />
                  {selectedImage === url && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check size={12} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(url);
                        }}
                        className="gap-1 text-xs"
                      >
                        <Download size={11} /> Download
                      </Button>
                      {selectedCampaign && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(url);
                            setShowAnchorDialog(true);
                          }}
                          className="gap-1 text-xs"
                        >
                          <Anchor size={11} /> Set Anchor
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions for selected */}
            {selectedImage && (
              <div className="flex flex-wrap gap-2 p-4 bg-card border border-border rounded-lg">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(selectedImage)}
                  className="gap-2"
                >
                  <Download size={13} /> Download
                </Button>
                {selectedCampaign && (
                  <Button
                    size="sm"
                    onClick={() => setShowAnchorDialog(true)}
                    className="gap-2"
                  >
                    <Anchor size={13} /> Mark as Campaign Anchor
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleGenerate}
                  className="gap-2"
                  disabled={generating}
                >
                  <RefreshCw size={13} /> Regenerate
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anchor Dialog */}
      <Dialog open={showAnchorDialog} onOpenChange={setShowAnchorDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Set as Campaign Anchor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full max-h-48 object-contain rounded-lg border border-border"
              />
            )}
            <div className="space-y-2">
              <Label>Anchor Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {ANCHOR_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setAnchorType(t)}
                    className={cn(
                      "px-3 py-2 rounded-md text-xs font-medium border transition-all capitalize",
                      anchorType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t === "primary" ? "Primary Anchor" : `${t} Reference`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAnchorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAnchor} className="gap-2">
              <Star size={13} /> Set as Anchor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
