import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Users,
  Megaphone,
  ImageIcon,
  Film,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5 flex items-start gap-4",
        accent && "border-primary/30 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "p-2.5 rounded-md",
          accent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-heading font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const stats = useQuery(api.clients.getStats);
  const recentImages = useQuery(api.imageGenerations.recent, { limit: 6 });

  const isLoading = stats === undefined;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
            Musalhu Creative Studio
          </p>
          <h1 className="text-2xl font-heading font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/clients")}
            className="gap-2"
          >
            <Plus size={14} />
            New Client
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/image-studio")}
            className="gap-2"
          >
            <ImageIcon size={14} />
            Generate Image
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Clients"
              value={stats?.totalClients ?? 0}
              accent
            />
            <StatCard
              icon={Megaphone}
              label="Active Campaigns"
              value={stats?.activeCampaigns ?? 0}
            />
            <StatCard
              icon={ImageIcon}
              label="Images Generated"
              value={recentImages?.length ?? 0}
              sub="recent"
            />
            <StatCard
              icon={Film}
              label="Reel Projects"
              value={stats?.recentReels?.length ?? 0}
              sub="recent"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-heading font-semibold tracking-wide text-muted-foreground uppercase mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Users,
              label: "New Client",
              desc: "Add a new client project",
              to: "/clients",
            },
            {
              icon: Megaphone,
              label: "New Campaign",
              desc: "Start a creative campaign",
              to: "/campaigns",
            },
            {
              icon: ImageIcon,
              label: "Generate Image",
              desc: "AI image generation",
              to: "/image-studio",
            },
            {
              icon: Film,
              label: "Create Reel",
              desc: "Storyboard & animate",
              to: "/reel-studio",
            },
          ].map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 hover:bg-card/80 transition-all group"
            >
              <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors w-fit mb-3">
                <action.icon size={16} />
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-heading font-semibold tracking-wide text-muted-foreground uppercase">
            Recent Generations
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground"
            onClick={() => navigate("/library")}
          >
            View all <ArrowRight size={12} />
          </Button>
        </div>

        {recentImages === undefined ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : recentImages.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <ImageIcon size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No images generated yet</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => navigate("/image-studio")}
            >
              Generate your first image
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {recentImages.map((gen) =>
              gen.imageUrls?.[0] ? (
                <button
                  key={gen._id}
                  onClick={() => navigate("/library")}
                  className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors group relative"
                >
                  <img
                    src={gen.imageUrls[0]}
                    alt="Generated"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {gen.isAnchor && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold px-1 rounded">
                      ANCHOR
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={gen._id}
                  className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center"
                >
                  <Clock size={16} className="text-muted-foreground/40" />
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Recent Campaigns */}
      {stats?.recentReels && stats.recentReels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-heading font-semibold tracking-wide text-muted-foreground uppercase">
              Recent Reel Projects
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground"
              onClick={() => navigate("/reel-studio")}
            >
              View all <ArrowRight size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.recentReels.map((reel) => (
              <button
                key={reel._id}
                onClick={() => navigate("/reel-studio")}
                className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                  <Film size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{reel.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{reel.status}</p>
                </div>
                <TrendingUp size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
