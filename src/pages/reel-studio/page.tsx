import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import {
  Film,
  Plus,
  GripVertical,
  Trash2,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

const MOTION_PRESETS = [
  "Slow cinematic push-in",
  "Slow pull-back",
  "Left-to-right pan",
  "Right-to-left pan",
  "Orbit",
  "Product close-up",
  "Subtle parallax",
  "Overhead reveal",
  "Luxury slow motion",
  "Dynamic commercial motion",
  "Environmental movement only",
];

const VIDEO_PROVIDERS = ["Auto", "Kling", "Veo", "Mock"];
const FORMATS = ["9:16 Vertical", "1:1 Square", "16:9 Landscape"];

const STATUS_ICONS: Record<string, React.ElementType> = {
  idle: Clock,
  queued: Clock,
  processing: RefreshCw,
  completed: CheckCircle2,
  failed: AlertCircle,
};

export default function ReelStudioPage() {
  const clients = useQuery(api.clients.list, {});
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [showCreateReel, setShowCreateReel] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Id<"reel_projects"> | null>(
    null,
  );

  const campaigns = useQuery(
    api.campaigns.listByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );
  const reels = useQuery(
    api.reels.listByClient,
    selectedClient ? { clientId: selectedClient as Id<"clients"> } : "skip",
  );

  const createReel = useMutation(api.reels.create);
  const [reelForm, setReelForm] = useState({
    name: "",
    objective: "",
    format: "9:16 Vertical",
  });
  const [creatingReel, setCreatingReel] = useState(false);

  const handleCreateReel = async () => {
    if (!selectedClient || !reelForm.name.trim()) return;
    setCreatingReel(true);
    try {
      const id = await createReel({
        clientId: selectedClient as Id<"clients">,
        campaignId: selectedCampaign
          ? (selectedCampaign as Id<"campaigns">)
          : undefined,
        name: reelForm.name.trim(),
        objective: reelForm.objective || undefined,
        format: reelForm.format,
      });
      setSelectedReel(id);
      setShowCreateReel(false);
      toast.success("Reel project created");
    } catch {
      toast.error("Failed to create reel");
    } finally {
      setCreatingReel(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4 bg-sidebar">
        <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
          Studio
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-lg font-heading font-semibold text-foreground">
            Reel Studio
          </h1>
          <div className="flex gap-2">
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedCampaign("");
                setSelectedReel(null);
              }}
              className="bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">Select client...</option>
              {clients?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedClient && (
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
              >
                <option value="">All reels</option>
                {campaigns?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <Button
              size="sm"
              className="gap-2"
              disabled={!selectedClient}
              onClick={() => setShowCreateReel(true)}
            >
              <Plus size={14} /> New Reel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Reel List */}
        <div className="w-72 border-r border-border bg-sidebar overflow-y-auto shrink-0">
          {!selectedClient ? (
            <div className="p-6 text-center">
              <Film
                size={32}
                className="mx-auto text-muted-foreground/30 mb-3"
              />
              <p className="text-xs text-muted-foreground">
                Select a client to see reel projects
              </p>
            </div>
          ) : reels === undefined ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reels.length === 0 ? (
            <div className="p-6 text-center">
              <Film
                size={32}
                className="mx-auto text-muted-foreground/30 mb-3"
              />
              <p className="text-xs text-muted-foreground mb-3">
                No reel projects
              </p>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowCreateReel(true)}
              >
                <Plus size={12} /> Create Reel
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {reels.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelectedReel(r._id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-md transition-all",
                    selectedReel === r._id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted border border-transparent",
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {r.format} · {r.status}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Storyboard */}
        <div className="flex-1 overflow-auto">
          {selectedReel ? (
            <ReelStoryboard
              reelProjectId={selectedReel}
              clientId={selectedClient as Id<"clients">}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <Film size={40} className="mx-auto text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  Select a reel project or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Reel Dialog */}
      <Dialog open={showCreateReel} onOpenChange={setShowCreateReel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">New Reel Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reel Name *</Label>
              <Input
                value={reelForm.name}
                onChange={(e) =>
                  setReelForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Kitchen Collection Reel"
              />
            </div>
            <div className="space-y-2">
              <Label>Objective</Label>
              <Textarea
                value={reelForm.objective}
                onChange={(e) =>
                  setReelForm((f) => ({ ...f, objective: e.target.value }))
                }
                placeholder="What should this reel communicate?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <select
                value={reelForm.format}
                onChange={(e) =>
                  setReelForm((f) => ({ ...f, format: e.target.value }))
                }
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateReel(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateReel}
              disabled={!reelForm.name.trim() || creatingReel}
            >
              {creatingReel ? "Creating..." : "Create Reel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReelStoryboard({
  reelProjectId,
  clientId,
}: {
  reelProjectId: Id<"reel_projects">;
  clientId: Id<"clients">;
}) {
  const reel = useQuery(api.reels.get, { reelProjectId });
  const scenes = useQuery(api.reels.getScenes, { reelProjectId });
  const addScene = useMutation(api.reels.addScene);
  const updateScene = useMutation(api.reels.updateScene);
  const deleteScene = useMutation(api.reels.deleteScene);
  const createVideoJob = useMutation(api.videoJobs.create);
  const updateVideoJob = useMutation(api.videoJobs.update);
  const generateKlingVideo = useAction(api.ai.kling.generateVideo);

  const imageGenerations = useQuery(api.imageGenerations.listByClient, {
    clientId,
  });

  const [showAddScene, setShowAddScene] = useState(false);
  const [generatingScene, setGeneratingScene] =
    useState<Id<"reel_scenes"> | null>(null);
  const [sceneForm, setSceneForm] = useState({
    description: "",
    motionPrompt: "",
    cameraMovement: MOTION_PRESETS[0],
    duration: 5,
    onScreenText: "",
    transition: "Fade",
    videoProvider: "Auto",
    referenceImageUrl: "",
  });

  const handleAddScene = async () => {
    const sceneNumber = (scenes?.length ?? 0) + 1;
    await addScene({
      reelProjectId,
      sceneNumber,
      ...sceneForm,
      duration: sceneForm.duration,
      referenceImageUrl: sceneForm.referenceImageUrl || undefined,
    });
    setShowAddScene(false);
    setSceneForm({
      description: "",
      motionPrompt: "",
      cameraMovement: MOTION_PRESETS[0],
      duration: 5,
      onScreenText: "",
      transition: "Fade",
      videoProvider: "Auto",
      referenceImageUrl: "",
    });
    toast.success("Scene added");
  };

  const handleGenerateScene = async (scene: Doc<"reel_scenes">) => {
    if (!scene.referenceImageUrl) {
      toast.error("Add a reference image before generating video");
      return;
    }

    setGeneratingScene(scene._id);
    let jobId: Id<"video_jobs"> | null = null;
    try {
      jobId = await createVideoJob({
        reelSceneId: scene._id,
        clientId,
        provider: "kling",
        inputImageUrl: scene.referenceImageUrl,
        motionPrompt: scene.motionPrompt,
      });
      await updateScene({
        sceneId: scene._id,
        generationStatus: "processing",
        videoJobId: jobId,
      });
      const result = await generateKlingVideo({
        imageUrl: scene.referenceImageUrl,
        prompt: [scene.description, scene.motionPrompt, scene.cameraMovement]
          .filter(Boolean)
          .join(". "),
        duration: scene.duration ?? 5,
      });
      await updateVideoJob({
        jobId,
        status: "completed",
        providerJobId: result.taskId,
        outputUrl: result.outputUrl,
        storageId: result.storageId,
      });
      await updateScene({
        sceneId: scene._id,
        generationStatus: "completed",
        generatedClipUrl: result.outputUrl,
      });
      toast.success("Kling video generated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Kling generation failed";
      if (jobId) {
        await updateVideoJob({
          jobId,
          status: "failed",
          errorMessage: message,
        }).catch(() => {});
      }
      await updateScene({
        sceneId: scene._id,
        generationStatus: "failed",
      }).catch(() => {});
      toast.error("Kling generation failed", { description: message });
    } finally {
      setGeneratingScene(null);
    }
  };

  if (!reel || !scenes) return <Skeleton className="m-6 h-64 w-auto" />;

  const sortedScenes = [...scenes].sort(
    (a, b) => a.sceneNumber - b.sceneNumber,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Reel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground">
            {reel.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {reel.format} · {sortedScenes.length} scene
            {sortedScenes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddScene(true)}
          className="gap-2"
        >
          <Plus size={14} /> Add Scene
        </Button>
      </div>

      {/* Scenes */}
      {sortedScenes.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
          <Film size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No scenes yet — start building your storyboard
          </p>
          <Button
            size="sm"
            className="mt-3 gap-2"
            onClick={() => setShowAddScene(true)}
          >
            <Plus size={13} /> Add First Scene
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedScenes.map((scene, idx) => {
            const StatusIcon = STATUS_ICONS[scene.generationStatus ?? "idle"];
            return (
              <div
                key={scene._id}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <div className="flex items-start gap-4 p-4">
                  <div className="shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                    {scene.sceneNumber}
                  </div>

                  {/* Reference image */}
                  <div className="shrink-0">
                    {scene.referenceImageUrl ? (
                      <img
                        src={scene.referenceImageUrl}
                        alt="Reference"
                        className="w-16 h-16 object-cover rounded border border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded border border-dashed border-border flex items-center justify-center bg-muted">
                        <ImageIcon
                          size={16}
                          className="text-muted-foreground/40"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scene details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {scene.description || "Scene " + scene.sceneNumber}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {scene.cameraMovement && (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          {scene.cameraMovement}
                        </span>
                      )}
                      {scene.duration && <span>{scene.duration}s</span>}
                      {scene.videoProvider && (
                        <span className="text-primary/80">
                          {scene.videoProvider}
                        </span>
                      )}
                    </div>
                    {scene.motionPrompt && (
                      <p className="text-xs text-muted-foreground/60 line-clamp-1">
                        {scene.motionPrompt}
                      </p>
                    )}
                    {scene.onScreenText && (
                      <p className="text-xs text-foreground/60 italic">{`"${scene.onScreenText}"`}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="shrink-0 flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        scene.generationStatus === "completed"
                          ? "text-green-400"
                          : scene.generationStatus === "failed"
                            ? "text-destructive"
                            : scene.generationStatus === "processing"
                              ? "text-primary"
                              : "text-muted-foreground",
                      )}
                    >
                      <StatusIcon
                        size={12}
                        className={
                          scene.generationStatus === "processing"
                            ? "animate-spin"
                            : ""
                        }
                      />
                      <span className="capitalize hidden sm:inline">
                        {scene.generationStatus ?? "idle"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        !scene.referenceImageUrl ||
                        generatingScene === scene._id
                      }
                      onClick={() => handleGenerateScene(scene)}
                    >
                      {generatingScene === scene._id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Play size={13} />
                      )}
                      {generatingScene === scene._id
                        ? "Generating"
                        : "Generate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteScene({ sceneId: scene._id })}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Generated clip preview */}
                {scene.generatedClipUrl && (
                  <div className="px-4 pb-4">
                    <video
                      src={scene.generatedClipUrl}
                      controls
                      className="w-full max-h-48 rounded border border-border"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video generation note */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs font-medium text-foreground mb-1">
          Video Generation
        </p>
        <p className="text-xs text-muted-foreground">
          To generate video clips, add your Kling API key or Google Veo API key
          in Settings. Each scene can be animated independently using
          image-to-video. Select a reference image for each scene for best
          results.
        </p>
      </div>

      {/* Add Scene Dialog */}
      <Dialog open={showAddScene} onOpenChange={setShowAddScene}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Scene</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Scene Description</Label>
              <Textarea
                value={sceneForm.description}
                onChange={(e) =>
                  setSceneForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What happens in this scene..."
                rows={2}
              />
            </div>

            {/* Reference image from past generations */}
            <div className="space-y-2">
              <Label>Reference Image (from generated images)</Label>
              {imageGenerations && imageGenerations.length > 0 ? (
                <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto">
                  {imageGenerations
                    .flatMap((g) => g.imageUrls ?? [])
                    .slice(0, 20)
                    .map((url, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setSceneForm((f) => ({
                            ...f,
                            referenceImageUrl: url,
                          }))
                        }
                        className={cn(
                          "aspect-square rounded overflow-hidden border-2 transition-all",
                          sceneForm.referenceImageUrl === url
                            ? "border-primary"
                            : "border-border",
                        )}
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Generate images in Image Studio first
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motion Prompt</Label>
              <Textarea
                value={sceneForm.motionPrompt}
                onChange={(e) =>
                  setSceneForm((f) => ({ ...f, motionPrompt: e.target.value }))
                }
                placeholder="Describe the motion and animation..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Camera Movement</Label>
                <select
                  value={sceneForm.cameraMovement}
                  onChange={(e) =>
                    setSceneForm((f) => ({
                      ...f,
                      cameraMovement: e.target.value,
                    }))
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {MOTION_PRESETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  min={5}
                  max={10}
                  step={5}
                  value={sceneForm.duration}
                  onChange={(e) =>
                    setSceneForm((f) => ({
                      ...f,
                      duration: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Video Provider</Label>
                <select
                  value={sceneForm.videoProvider}
                  onChange={(e) =>
                    setSceneForm((f) => ({
                      ...f,
                      videoProvider: e.target.value,
                    }))
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {VIDEO_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Transition</Label>
                <select
                  value={sceneForm.transition}
                  onChange={(e) =>
                    setSceneForm((f) => ({ ...f, transition: e.target.value }))
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {["Fade", "Cut", "Dissolve", "Wipe", "Zoom"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>On-Screen Text</Label>
              <Input
                value={sceneForm.onScreenText}
                onChange={(e) =>
                  setSceneForm((f) => ({ ...f, onScreenText: e.target.value }))
                }
                placeholder="Text to display during this scene..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddScene(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddScene}>Add Scene</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Need to import ImageIcon
function ImageIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
