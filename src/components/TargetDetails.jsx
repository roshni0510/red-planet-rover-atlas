import { X } from "lucide-react";
import { findImageUrl, labelOf } from "@/services/dataUtils";
import DataView from "./common/DataView";
import SafeImage from "./common/SafeImage";

/** Details for a clicked map feature or a selected target — backend properties only. */
export default function TargetDetails({ properties, layerLabel, onClose, compact = false }) {
  if (!properties) return null;
  const image = findImageUrl(properties);
  return (
    <div className={`rounded-md border border-border bg-popover text-popover-foreground shadow-lg ${compact ? "w-72" : "w-full"}`}>
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          {layerLabel && <p className="label-caps">{layerLabel}</p>}
          <p className="truncate text-sm font-semibold">{labelOf(properties)}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close details">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {image && <SafeImage src={image} alt={labelOf(properties)} className="h-36 w-full" />}
      <div className={`overflow-y-auto px-3 py-2.5 ${compact ? "max-h-56" : ""}`}>
        <DataView data={properties} />
      </div>
    </div>
  );
}
