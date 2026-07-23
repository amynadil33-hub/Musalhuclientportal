import { useState } from "react";
import type { ValidationIssue } from "@/lib/dhivehi/validation.ts";
import { cn } from "@/lib/utils.ts";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function ValidationBar({
  issues,
  onFocusLayer,
}: {
  issues: ValidationIssue[];
  onFocusLayer: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const allPassed = errors.length === 0 && warnings.length === 0;

  return (
    <div className="border-t border-border bg-sidebar shrink-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs"
      >
        {allPassed ? (
          <CheckCircle2 size={14} className="text-green-500" />
        ) : errors.length > 0 ? (
          <XCircle size={14} className="text-destructive" />
        ) : (
          <AlertTriangle size={14} className="text-amber-500" />
        )}
        <span className="font-medium text-foreground">
          {allPassed
            ? "All checks passed"
            : `${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
        </span>
        <span className="ml-auto text-muted-foreground">
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {expanded && !allPassed && (
        <div className="max-h-40 overflow-auto px-4 pb-3 space-y-1">
          {[...errors, ...warnings].map((issue, idx) => (
            <button
              key={idx}
              onClick={() => issue.layerId && onFocusLayer(issue.layerId)}
              className={cn(
                "w-full text-left flex items-start gap-2 text-[11px] rounded px-2 py-1 hover:bg-muted transition-colors",
                issue.level === "error" ? "text-destructive" : "text-amber-500",
              )}
            >
              {issue.level === "error" ? (
                <XCircle size={12} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              )}
              <span className="text-foreground/90">{issue.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
