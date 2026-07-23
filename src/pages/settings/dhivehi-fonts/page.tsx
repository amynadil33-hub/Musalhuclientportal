import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import FontCard from "./_components/FontCard.tsx";
import FontUploadDialog from "./_components/FontUploadDialog.tsx";
import { Plus, ArrowLeft, Type, Info } from "lucide-react";

export default function DhivehiFontsPage() {
  const fonts = useQuery(api.dhivehiFonts.list, {});
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-3">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} /> Back to Settings
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
              <Type size={20} className="text-primary" />
              Dhivehi Font Manager
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Manage the Thaana fonts available in the Dhivehi Ad Composer.
              Every uploaded font is checked for Thaana glyph coverage so
              designers only reach for fonts that actually render Dhivehi.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={15} /> Upload font
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Only upload fonts you are licensed to use commercially. Thaana is a
          right-to-left script — the composer handles direction automatically,
          but the font itself must contain the Thaana Unicode block (U+0780 to
          U+07B1).
        </p>
      </div>

      {fonts === undefined ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      ) : fonts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Type size={28} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              No Dhivehi fonts yet
            </p>
            <p className="text-xs text-muted-foreground">
              Upload your first Thaana font to start composing Dhivehi ads.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} variant="secondary">
            <Plus size={15} /> Upload font
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fonts.map((font) => (
            <FontCard key={font._id} font={font} />
          ))}
        </div>
      )}

      <FontUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
