import { Activity, Database, Gauge, Navigation as NavIcon, Rocket, Target, Thermometer } from "lucide-react";
import Panel from "@/components/common/Panel";
import DataState from "@/components/common/DataState";
import DataView from "@/components/common/DataView";
import HazardPanel from "@/components/HazardPanel";
import { api } from "@/services/api";
import { useApiQuery } from "@/services/useApiQuery";
import { labelOf, toList } from "@/services/dataUtils";

function StatTile({ icon: Icon, label, query, value }) {
  let display = "—";
  let note = "Not connected";
  if (query.readiness === "ready") {
    if (query.isPending) note = "Loading…";
    else if (query.isError) note = "Unavailable";
    else {
      const v = value(query.data);
      if (v !== null && v !== undefined) {
        display = v;
        note = "From backend";
      } else note = "No data";
    }
  }
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-primary" aria-hidden />
        <p className="label-caps">{label}</p>
      </div>
      <p className="mt-2 truncate font-mono text-2xl font-medium">{display}</p>
      <p className="text-[0.6875rem] text-muted-foreground">{note}</p>
    </div>
  );
}

const listCount = (d) => {
  const l = toList(d);
  return l ? l.length : null;
};
const statusText = (d) => (typeof d === "string" ? d : d && typeof d === "object" ? (d.status ?? d.state ?? null) : null);

export default function Dashboard() {
  const mission = useApiQuery("mission", api.getMission);
  const datasets = useApiQuery("datasets", api.getDatasets);
  const targets = useApiQuery("targets", api.getTargets);
  const routeStatus = useApiQuery("routeStatus", api.getRouteStatus);
  const terrainRisk = useApiQuery("terrainRisk", api.getTerrainRisk);
  const environment = useApiQuery("environment", api.getEnvironment);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <Panel title="Mission" icon={Rocket}>
        <DataState query={mission} emptyText="The backend returned no mission details.">
          {(data) => (
            <div>
              {typeof data === "object" && !Array.isArray(data) && (data.name || data.title) && (
                <p className="mb-3 text-xl font-semibold tracking-wide">{labelOf(data)}</p>
              )}
              <DataView data={data} />
            </div>
          )}
        </DataState>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Target} label="Scientific targets" query={targets} value={listCount} />
        <StatTile icon={Database} label="Datasets" query={datasets} value={listCount} />
        <StatTile icon={NavIcon} label="Route status" query={routeStatus} value={statusText} />
        <StatTile icon={Gauge} label="Risk indicators" query={terrainRisk} value={listCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Available datasets" icon={Database}>
          <DataState query={datasets} emptyText="No datasets returned by the backend.">
            {(data) => {
              const list = toList(data);
              return list ? (
                <ul className="space-y-2">
                  {list.map((d, i) => (
                    <li key={i} className="rounded border border-border bg-surface px-3 py-2">
                      <p className="text-sm font-medium">{labelOf(d, i)}</p>
                      {d && typeof d === "object" && <DataView data={d} depth={1} />}
                    </li>
                  ))}
                </ul>
              ) : (
                <DataView data={data} />
              );
            }}
          </DataState>
        </Panel>

        <Panel title="Current route status" icon={NavIcon}>
          <DataState query={routeStatus} emptyText="No route status returned by the backend.">
            {(data) => <DataView data={data} />}
          </DataState>
        </Panel>

        <Panel title="Terrain risk indicators" icon={Activity}>
          <DataState query={terrainRisk} emptyText="No terrain risk indicators returned by the backend.">
            {(data) => <DataView data={data} />}
          </DataState>
          <div className="mt-4">
            <p className="label-caps mb-2">Mapped hazards</p>
            <HazardPanel />
          </div>
        </Panel>

        <Panel title="Environmental observations" icon={Thermometer}>
          <DataState query={environment} emptyText="No environmental observations returned by the backend.">
            {(data) => <DataView data={data} />}
          </DataState>
        </Panel>
      </div>
    </div>
  );
}
