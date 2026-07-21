import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  RefreshCw,
  Save,
  XCircle,
} from "lucide-react";

export default function SettingsPage() {
  const monthlyUsage = useQuery(api.settings.getMonthly);
  const setSetting = useMutation(api.settings.setSetting);
  const checkProviders = useAction(api.ai.providerHealth.checkProviders);
  const teamAccounts = useQuery(api.users.listTeamAccounts);
  const setTeamAccountApproval = useMutation(api.users.setTeamAccountApproval);

  const defaultQuality = useQuery(api.settings.getSetting, {
    key: "default_image_quality",
  });
  const defaultVideoProvider = useQuery(api.settings.getSetting, {
    key: "default_video_provider",
  });
  const monthlyWarning = useQuery(api.settings.getSetting, {
    key: "monthly_usage_warning_usd",
  });

  const [saving, setSaving] = useState<string | null>(null);
  const [checkingProviders, setCheckingProviders] = useState(false);
  const [updatingAccount, setUpdatingAccount] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<Awaited<
    ReturnType<typeof checkProviders>
  > | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    try {
      await setSetting({ key, value });
      toast.success("Setting saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const handleCheckProviders = async () => {
    setCheckingProviders(true);
    try {
      const result = await checkProviders({});
      setProviderStatus(result);
      if (result.openai.ok && result.kling.ok) {
        toast.success("OpenAI and Kling are connected");
      } else {
        toast.error("One or more provider checks failed");
      }
    } catch (error) {
      toast.error("Provider check failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCheckingProviders(false);
    }
  };

  const handleAccountApproval = async (
    userId: Parameters<typeof setTeamAccountApproval>[0]["userId"],
    status: "approved" | "rejected",
  ) => {
    setUpdatingAccount(userId);
    try {
      await setTeamAccountApproval({ userId, status });
      toast.success(status === "approved" ? "Team account approved" : "Team account rejected");
    } catch (error) {
      toast.error("Could not update team account", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUpdatingAccount(null);
    }
  };

  const getValue = (key: string, fallback: string) =>
    tempValues[key] ??
    (key === "default_image_quality"
      ? defaultQuality?.value
      : key === "default_video_provider"
        ? defaultVideoProvider?.value
        : key === "monthly_usage_warning_usd"
          ? monthlyWarning?.value
          : undefined) ??
    fallback;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase mb-1">
          System
        </p>
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your creative studio
        </p>
      </div>

      {/* Team Access */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-heading font-semibold text-foreground">
            Team Account Approvals
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Only the owner can approve access to the Creative Studio.
          </p>
        </div>
        {teamAccounts === undefined ? (
          <Skeleton className="h-20 w-full" />
        ) : teamAccounts.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/30 p-3">
            No team account requests yet.
          </p>
        ) : (
          <div className="space-y-2">
            {teamAccounts.map((account) => (
              <div
                key={account._id}
                className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {account.email}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    Status: {account.approvalStatus}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccountApproval(account._id, "approved")}
                    disabled={updatingAccount === account._id || account.approvalStatus === "approved"}
                  >
                    <Check size={13} /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAccountApproval(account._id, "rejected")}
                    disabled={updatingAccount === account._id || account.approvalStatus === "rejected"}
                  >
                    <XCircle size={13} /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys Notice */}
      <div className="bg-card border border-primary/20 rounded-lg p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              API Keys & Secrets
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              API keys are stored securely as Convex deployment environment
              variables and are never exposed in the browser.
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-3 space-y-1.5">
          {[
            {
              key: "OPENAI_API_KEY",
              desc: "Direct OpenAI prompt and image generation",
            },
            {
              key: "KLING_API_KEY",
              desc: "Direct Kling AI image-to-video generation",
            },
            {
              key: "KLING_API_BASE_URL",
              desc: "Kling API base URL (default: https://api.klingai.com)",
            },
            {
              key: "GOOGLE_GENERATIVE_AI_API_KEY",
              desc: "Google Veo video generation",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-start gap-2">
              <code className="text-xs bg-muted text-primary px-1.5 py-0.5 rounded shrink-0">
                {item.key}
              </code>
              <span className="text-xs text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 space-y-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCheckProviders}
            disabled={checkingProviders}
          >
            <RefreshCw
              size={13}
              className={checkingProviders ? "animate-spin" : undefined}
            />
            {checkingProviders ? "Checking..." : "Test provider connections"}
          </Button>
          {providerStatus && (
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: "OpenAI", result: providerStatus.openai },
                { name: "Kling", result: providerStatus.kling },
              ].map(({ name, result }) => (
                <div
                  key={name}
                  className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3"
                >
                  {result.ok ? (
                    <CheckCircle2 size={15} className="mt-0.5 text-green-500" />
                  ) : (
                    <XCircle size={15} className="mt-0.5 text-destructive" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        <h2 className="text-sm font-heading font-semibold text-foreground">
          Application Defaults
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default Image Quality</Label>
            <div className="flex gap-2">
              <select
                value={getValue("default_image_quality", "standard")}
                onChange={(e) =>
                  setTempValues((v) => ({
                    ...v,
                    default_image_quality: e.target.value,
                  }))
                }
                className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
              <Button
                size="sm"
                onClick={() =>
                  handleSave(
                    "default_image_quality",
                    getValue("default_image_quality", "standard"),
                  )
                }
                disabled={saving === "default_image_quality"}
              >
                {saving === "default_image_quality" ? (
                  "..."
                ) : (
                  <Save size={13} />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Video Provider</Label>
            <div className="flex gap-2">
              <select
                value={getValue("default_video_provider", "kling")}
                onChange={(e) =>
                  setTempValues((v) => ({
                    ...v,
                    default_video_provider: e.target.value,
                  }))
                }
                className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="kling">Kling</option>
                <option value="veo">Google Veo</option>
                <option value="mock">Mock (testing)</option>
              </select>
              <Button
                size="sm"
                onClick={() =>
                  handleSave(
                    "default_video_provider",
                    getValue("default_video_provider", "kling"),
                  )
                }
                disabled={saving === "default_video_provider"}
              >
                {saving === "default_video_provider" ? (
                  "..."
                ) : (
                  <Save size={13} />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monthly Usage Warning (USD)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={getValue("monthly_usage_warning_usd", "50")}
                onChange={(e) =>
                  setTempValues((v) => ({
                    ...v,
                    monthly_usage_warning_usd: e.target.value,
                  }))
                }
                placeholder="50"
              />
              <Button
                size="sm"
                onClick={() =>
                  handleSave(
                    "monthly_usage_warning_usd",
                    getValue("monthly_usage_warning_usd", "50"),
                  )
                }
                disabled={saving === "monthly_usage_warning_usd"}
              >
                {saving === "monthly_usage_warning_usd" ? (
                  "..."
                ) : (
                  <Save size={13} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-heading font-semibold text-foreground">
          Monthly Usage (This Month)
        </h2>
        {monthlyUsage === undefined || monthlyUsage === null ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-heading font-semibold text-foreground">
                {monthlyUsage.totalImages}
              </p>
              <p className="text-xs text-muted-foreground">Images Generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-semibold text-foreground">
                {monthlyUsage.totalVideos}
              </p>
              <p className="text-xs text-muted-foreground">Videos Generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-semibold text-primary">
                ${monthlyUsage.totalCost.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/60">
          Costs are estimates based on OpenAI pricing. Actual charges may
          differ. Always check your provider dashboard.
        </p>
      </div>

      {/* Video Providers Info */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-heading font-semibold text-foreground">
          Video Provider Adapters
        </h2>
        <p className="text-xs text-muted-foreground">
          The system uses a provider-independent interface. Adding your API key
          enables that provider automatically.
        </p>
        <div className="space-y-2">
          {[
            {
              name: "Kling",
              key: "KLING_API_KEY",
              status: "Requires API key in Secrets",
              desc: "Premium AI video generation with image-to-video",
            },
            {
              name: "Google Veo",
              key: "GOOGLE_GENERATIVE_AI_API_KEY",
              status: "Requires API key in Secrets",
              desc: "Google's video generation model",
            },
            {
              name: "Mock",
              key: "None required",
              status: "Always available",
              desc: "Returns placeholder videos for testing",
            },
          ].map((provider) => (
            <div
              key={provider.name}
              className="flex items-start gap-3 p-3 rounded-md bg-muted/30 border border-border"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {provider.name}
                </p>
                <p className="text-xs text-muted-foreground">{provider.desc}</p>
                <code className="text-[10px] text-primary/70">
                  {provider.key}
                </code>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {provider.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
