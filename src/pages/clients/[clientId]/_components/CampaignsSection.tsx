import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";
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
import { Plus, Megaphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const STATUS_COLORS: Record<string, string> = {
  Draft: "text-muted-foreground bg-muted",
  Active: "text-green-400 bg-green-400/10",
  Completed: "text-blue-400 bg-blue-400/10",
  Archived: "text-muted-foreground/60 bg-muted/60",
};

export default function CampaignsSection({ clientId }: { clientId: Id<"clients"> }) {
  const navigate = useNavigate();
  const campaigns = useQuery(api.campaigns.listByClient, { clientId });
  const createCampaign = useMutation(api.campaigns.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "", slogan: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const id = await createCampaign({
        clientId,
        name: form.name.trim(),
        objective: form.objective || undefined,
        slogan: form.slogan || undefined,
      });
      toast.success("Campaign created");
      setShowCreate(false);
      setForm({ name: "", objective: "", slogan: "" });
      navigate(`/campaigns/${id}`);
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  if (campaigns === undefined) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-heading font-semibold text-foreground">Campaigns</h2>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={14} />
          New Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Megaphone size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No campaigns yet</p>
          <Button size="sm" className="mt-3 gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div
              key={c._id}
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-primary/40 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{c.name}</p>
                {c.objective && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.objective}</p>
                )}
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[c.status] ?? "text-muted-foreground bg-muted")}>
                {c.status}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/campaigns/${c._id}`)}
                className="gap-1 text-xs text-primary"
              >
                Open <ExternalLink size={11} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Transform Your Kitchen"
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Objective</Label>
              <Textarea
                value={form.objective}
                onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
                placeholder="What is this campaign trying to achieve?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input
                value={form.slogan}
                onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
                placeholder="Campaign tagline..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>
              {saving ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
