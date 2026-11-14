import { AlertTriangle, CheckCircle2, Loader2, PlugZap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { MAP_LAYERS } from "@/services/api";

const SWATCH = {
  geology: "var(--map-geology)",
  hazard: "var(--map-hazard)",
  target: "var(--map-target)",
  observation: "var(--map-observation)",
  route: "var(--map-route)",
};

function StatusLine({ cfg, status, hasRoute }) {
  if (cfg.kind === "route") {
    return hasRoute ? (
      <span className="flex items-center gap-1 text-success"><CheckCircle2 className="size-3" /> Route loaded</span>
    ) : (
      <span className="text-muted-foreground">Calculate a route in Navigation</span>
    );
  }
  const state = status?.state || (cfg.url ? "loading" : "pending");
  if (state === "pending") return <span className="flex items-center gap-1 text-muted-foreground"><PlugZap className="size-3" /> Source pending</span>;
  if (state === "loading") return <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Loading</span>;
  if (state === "error") return <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="size-3" /> {status?.message || "Failed"}</span>;
  return (
    <span className="flex items-center gap-1 text-success">
      <CheckCircle2 className="size-3" /> {typeof status?.count === "number" ? `${status.count} features` : "Loaded"}
    </span>
  );
}

function Legend({ cfg }) {
  if (cfg.legendUrl) return <img src={cfg.legendUrl} alt={`${cfg.label} legend`} className="mt-2 max-h-24 rounded-sm border border-border" />;
  if (cfg.style) {
    const line = cfg.kind === "route";
    return (
      <span className="mt-1.5 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
        <span
          className={line ? "h-0.5 w-4 rounded" : "size-2.5 rounded-full border border-background"}
          style={{ background: SWATCH[cfg.style] }}
          aria-hidden
        />
        Map symbol
      </span>
    );
  }
  return <span className="mt-1.5 block text-[0.6875rem] text-muted-foreground">Legend supplied with layer source</span>;
}

/** Layer visibility controls + legends for the Mars map. */
export default function LayerPanel({ visibility, onToggle, statuses = {}, hasRoute = false }) {
  return (
    <ul className="divide-y divide-border">
      {MAP_LAYERS.map((cfg) => {
        const available = cfg.kind === "route" ? hasRoute : !!cfg.url;
        return (
          <li key={cfg.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 text-xs">
              <p className="text-sm font-medium text-foreground">{cfg.label}</p>
              <StatusLine cfg={cfg} status={statuses[cfg.id]} hasRoute={hasRoute} />
              {available && <Legend cfg={cfg} />}
            </div>
            <Switch
              checked={available && visibility[cfg.id] !== false}
              onCheckedChange={() => onToggle(cfg.id)}
              disabled={!available}
              aria-label={`Toggle ${cfg.label}`}
            />
          </li>
        );
      })}
    </ul>
  );
}
