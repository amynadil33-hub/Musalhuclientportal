import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Users,
  Plus,
  Search,
  Archive,
  ExternalLink,
  Building2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

const INDUSTRIES = [
  "Carpentry & Interior",
  "Food & Beverage",
  "Fashion & Apparel",
  "Health & Wellness",
  "Real Estate",
  "Tourism & Hospitality",
  "Technology",
  "Retail",
  "Finance",
  "Education",
  "Beauty & Cosmetics",
  "Automotive",
  "Other",
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const clients = useQuery(api.clients.list, {});
  const createClient = useMutation(api.clients.create);
  const archiveClient = useMutation(api.clients.archive);

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("Other");
  const [isCreating, setIsCreating] = useState(false);

  const filtered = clients?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const clientId = await createClient({ name: newName.trim(), industry: newIndustry });
      setShowCreate(false);
      setNewName("");
      toast.success("Client created successfully");
      navigate(`/clients/${clientId}`);
    } catch {
      toast.error("Failed to create client");
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchive = async (clientId: string) => {
    try {
      await archiveClient({ clientId: clientId as Parameters<typeof archiveClient>[0]["clientId"] });
      toast.success("Client archived");
    } catch {
      toast.error("Failed to archive client");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
            Studio
          </p>
          <h1 className="text-2xl font-heading font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your client brand profiles and projects
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus size={14} />
          New Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-input"
        />
      </div>

      {/* Client Grid */}
      {clients === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Users size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">No clients yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first client to start building brand profiles
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={14} />
            Create Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((client) => (
            <div
              key={client._id}
              className={cn(
                "bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all group",
                client.isArchived && "opacity-50",
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {client.logoUrl ? (
                    <img
                      src={client.logoUrl}
                      alt={client.name}
                      className="w-10 h-10 rounded-md object-contain bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                      <Building2 size={18} className="text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm leading-tight">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{client.industry}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => navigate(`/clients/${client._id}`)}>
                      <ExternalLink size={12} className="mr-2" />
                      Open Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleArchive(client._id)}
                      className="text-destructive"
                    >
                      <Archive size={12} className="mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                {client.isArchived && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    Archived
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto gap-1 text-xs text-primary hover:text-primary"
                  onClick={() => navigate(`/clients/${client._id}`)}
                >
                  Open Project
                  <ExternalLink size={11} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Create New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                placeholder="e.g. Imperial Carpentry"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <select
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
