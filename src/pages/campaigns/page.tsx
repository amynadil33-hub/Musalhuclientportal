import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Plus, Megaphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const STATUS_COLORS: Record<string, string> = {
  Draft: "text-muted-foreground bg-muted",
  Active: "text-green-400 bg-green-400/10",
  Completed: "text-blue-400 bg-blue-400/10",
  Archived: "text-muted-foreground/60 bg-muted/60",
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const clients = useQuery(api.clients.list, {});
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");

  // Get campaigns for each client - a simple approach
  const campaigns = clients?.flatMap(() => []) ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
            Studio
          </p>
          <h1 className="text-2xl font-heading font-semibold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All creative campaigns across your clients
          </p>
        </div>
      </div>

      {/* Client Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedClient("all")}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
            selectedClient === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          All Clients
        </button>
        {clients?.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedClient(c._id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
              selectedClient === c._id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients === undefined ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))
        ) : (
          <>
            {clients
              .filter((c) => selectedClient === "all" || c._id === selectedClient)
              .map((client) => (
                <ClientCampaignCard key={client._id} client={client} />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function ClientCampaignCard({ client }: { client: { _id: string; name: string; industry: string } }) {
  const navigate = useNavigate();
  const campaigns = useQuery(
    api.campaigns.listByClient,
    { clientId: client._id as Id<"clients"> },
  );

  if (!campaigns) return <Skeleton className="h-40 w-full rounded-lg" />;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-muted/30">
        <div>
          <p className="text-sm font-medium text-foreground">{client.name}</p>
          <p className="text-xs text-muted-foreground">{client.industry}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1 text-primary"
          onClick={() => navigate(`/clients/${client._id}`)}
        >
          <ExternalLink size={11} />
        </Button>
      </div>
      <div className="p-3 space-y-2">
        {campaigns.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-2 text-center">No campaigns</p>
        ) : (
          campaigns.map((c) => (
            <button
              key={c._id}
              onClick={() => navigate(`/campaigns/${c._id}`)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-all group"
            >
              <Megaphone size={13} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="flex-1 text-xs text-foreground truncate">{c.name}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", STATUS_COLORS[c.status])}>
                {c.status}
              </span>
            </button>
          ))
        )}
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-xs gap-2 text-muted-foreground justify-start"
          onClick={() => navigate(`/clients/${client._id}?tab=campaigns`)}
        >
          <Plus size={12} />
          New Campaign
        </Button>
      </div>
    </div>
  );
}
