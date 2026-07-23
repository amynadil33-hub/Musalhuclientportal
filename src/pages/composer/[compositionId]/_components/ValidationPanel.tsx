import type { ValidationItem } from "@/lib/dhivehi/validation.ts";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export function ValidationPanel({
  items,
  onSelectLayer,
}: {
  items: ValidationItem[];
  onSelectLayer: (id: string) => void;
}) {
  const errors = items.filter((i) => i.level === "error");
  const warnings = items.filter((i) => i.level === "warning");

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        {errors.length === 0 && warnings.length === 0 ? (
          <span className="flex items-center gap-1.5 text-emerald-500">
            <CheckCircle2 size={14} /> All checks passed
          </span>
        ) : (
          <span className="flex items-center gap-3">
            {errors.length > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle size={14} /> {errors.length} error
                {errors.length !== 1 ? "s" : ""}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertTriangle size={14} /> {warnings.length} warning
                {warnings.length !== 1 ? "s" : ""}
              </span>
            )}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => item.layerId && onSelectLayer(item.layerId)}
                className={cn(
                  "w-full text-left flex items-start gap-2 text-[11px] px-2 py-1.5 rounded-md",
                  item.layerId ? "hover:bg-muted cursor-pointer" : "cursor-default",
                )}
              >
                {item.level === "error" ? (
                  <XCircle
                    size={12}
                    className="text-destructive mt-0.5 shrink-0"
                  />
                ) : item.level === "warning" ? (
                  <AlertTriangle
                    size={12}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                ) : (
                  <CheckCircle2
                    size={12}
                    className="text-emerald-500 mt-0.5 shrink-0"
                  />
                )}
                <span className="text-muted-foreground">{item.message}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
