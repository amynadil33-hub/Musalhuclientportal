"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUTPUT_FORMATS } from "@/lib/dhivehi/formats.ts";

export function NewCompositionDialog({
  open,
  onOpenChange,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: Id<"clients">;
}) {
  const navigate = useNavigate();
  const clients = useQuery(api.clients.list, {});
  const create = useMutation(api.dhivehiCompositions.create);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState<string>(defaultClientId ?? "");
  const [formatId, setFormatId] = useState<string>(OUTPUT_FORMATS[0].id);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!clientId) {
      toast.error("Select a client");
      return;
    }
    const format = OUTPUT_FORMATS.find((f) => f.id === formatId)!;
    setCreating(true);
    try {
      const id = await create({
        clientId: clientId as Id<"clients">,
        title: title.trim() || `Untitled ${format.label}`,
        canvasWidth: format.width,
        canvasHeight: format.height,
        outputFormat: format.id,
        backgroundColor: "#1a1a1a",
        layers: [],
      });
      toast.success("Composition created");
      onOpenChange(false);
      navigate(`/composer/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Dhivehi Composition</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="comp-title">Title</Label>
            <Input
              id="comp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ramadan sale poster"
            />
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={formatId} onValueChange={setFormatId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_FORMATS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label} ({f.width}×{f.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create & Open"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
