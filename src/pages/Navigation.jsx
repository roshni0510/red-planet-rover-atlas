import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Compass, Footprints, Info, Map as MapIcon, Route as RouteIcon, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel";
import { EmptyState } from "@/components/common/DataState";
import DataView from "@/components/common/DataView";
import RoutePlanner, { formatLonLat } from "@/components/RoutePlanner";
import HazardPanel from "@/components/HazardPanel";
import LazyMarsMap from "@/components/map/LazyMarsMap";
import { labelOf, lineVertices } from "@/services/dataUtils";

/** Find a field in the backend route result by name pattern (top level only). */
function field(result, pattern) {
  if (!result || typeof result !== "object") return undefined;
  const entry = Object.entries(result).find(([k]) => pattern.test(k));
  return entry ? entry[1] : undefined;
}

function waypointCoords(w) {
  if (Array.isArray(w) && typeof w[0] === "number") return w;
  if (w && typeof w === "object") {
    if (Array.isArray(w.coordinates)) return w.coordinates;
    if (w.geometry?.coordinates) return w.geometry.coordinates;
  }
  return null;
}

function WaypointLabel({ w, i }) {
  const coords = waypointCoords(w);
  const name = w && typeof w === "object" && !Array.isArray(w) ? labelOf(w, i) : `Waypoint ${i + 1}`;
  return (
    <span>
      {name}
      {coords && <span className="ml-2 font-mono text-xs text-muted-foreground">{formatLonLat(coords)}</span>}
    </span>
  );
}

function ValueOrPending({ value, label }) {
  if (value === undefined || value === null || value === "") {
    return <p className="text-sm text-muted-foreground">Not provided by backend</p>;
  }
  return typeof value === "object" ? <DataView data={value} depth={1} /> : <p className="font-mono text-2xl font-medium">{String(value)}</p>;
}

/** Mobile-friendly simulated walk along a backend-calculated route. */
function AstronautMode({ route }) {
  const [step, setStep] = useState(0);
  const data = route?.data;

  const waypoints = useMemo(() => {
    const w = field(data, /waypoint/i);
    if (Array.isArray(w) && w.length) return w;
    return lineVertices(route?.geojson);
  }, [data, route]);

  if (!route) {
    return <EmptyState text="Calculate a route in the planner first. Astronaut mode walks through the waypoints the backend returns." />;
  }
  if (waypoints.length < 2) {
    return <EmptyState text="The backend route contains no waypoint sequence to step through." />;
  }

  const index = Math.min(step, waypoints.length - 1);
  const current = waypoints[index];
  const next = waypoints[index + 1];
  const nextObj = next && typeof next === "object" && !Array.isArray(next) ? next : null;
  const direction = nextObj ? field(nextObj, /bearing|heading|direction/i) : undefined;
  const distance = nextObj ? field(nextObj, /distance/i) : undefined;
  const hazards = field(data, /hazard/i);
  const returnRoute = field(data, /return/i);

  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Simulation only. Position is stepped along the planned waypoints — no live positioning or suit integration.
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="label-caps">Simulated location · waypoint {index + 1} of {waypoints.length}</p>
        <p className="mt-1 text-lg font-semibold"><WaypointLabel w={current} i={index} /></p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" className="h-12 flex-1" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={index === 0}>
            <ChevronLeft /> Back
          </Button>
          <Button className="h-12 flex-1" onClick={() => setStep((s) => Math.min(waypoints.length - 1, s + 1))} disabled={!next}>
            Advance <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-primary/50 bg-card p-4">
        <p className="label-caps flex items-center gap-1.5"><Footprints className="size-3.5 text-primary" /> Next waypoint</p>
        {next ? <p className="mt-1 text-base font-medium"><WaypointLabel w={next} i={index + 1} /></p> : <p className="mt-1 text-sm text-success">Destination reached</p>}
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <p className="label-caps mb-1 flex items-center gap-1"><Compass className="size-3" /> Direction</p>
            <ValueOrPending value={direction} />
          </div>
          <div>
            <p className="label-caps mb-1">Distance</p>
            <ValueOrPending value={distance} />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="label-caps mb-2 flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-destructive" /> Upcoming mapped hazards</p>
        {hazards === undefined ? <p className="text-sm text-muted-foreground">Not provided by backend</p> : <HazardPanel items={Array.isArray(hazards) ? hazards : [hazards]} />}
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="label-caps mb-2 flex items-center gap-1.5"><Undo2 className="size-3.5 text-primary" /> Return route</p>
        {returnRoute === undefined ? <p className="text-sm text-muted-foreground">Not provided by backend</p> : <DataView data={returnRoute} depth={1} />}
      </div>
    </div>
  );
}

export default function Navigation() {
  const [view, setView] = useState("planner");
  const [points, setPoints] = useState({ start: null, destination: null });
  const [pickMode, setPickMode] = useState(null);
  const [results, setResults] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);

  const setPoint = (key, value) => setPoints((p) => ({ ...p, [key]: value }));
  const onPick = useCallback((lonLat, mode) => {
    const key = mode === "destination" ? "destination" : "start";
    setPoints((p) => ({ ...p, [key]: { type: "map", lonLat, label: formatLonLat(lonLat) } }));
    setPickMode(null);
  }, []);

  const activeRoute = results.find((r) => r.id === activeId) || null;
  const mapRoutes = useMemo(() => results.filter((r) => r.geojson).map((r) => ({ id: r.id, geojson: r.geojson, active: r.id === activeId })), [results, activeId]);
  const picks = useMemo(
    () => [points.start?.type === "map" && { id: "start", lonLat: points.start.lonLat }, points.destination?.type === "map" && { id: "destination", lonLat: points.destination.lonLat }].filter(Boolean),
    [points],
  );

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border bg-surface p-0.5" role="tablist">
        {[
          { id: "planner", label: "Route planner", icon: RouteIcon },
          { id: "astronaut", label: "Astronaut mode", icon: Footprints },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors ${view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {view === "planner" ? (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Panel title="Route planner" icon={RouteIcon}>
            <RoutePlanner
              points={points}
              setPoint={setPoint}
              pickMode={pickMode}
              setPickMode={setPickMode}
              results={results}
              setResults={setResults}
              activeId={activeId}
              setActiveId={setActiveId}
              compareIds={compareIds}
              setCompareIds={setCompareIds}
            />
          </Panel>
          <div className="space-y-4">
            <LazyMarsMap className="h-[55vh] lg:h-[calc(100vh-14rem)]" routes={mapRoutes} pickMode={pickMode} onPick={onPick} picks={picks} />
            <Panel title="Mapped hazards" icon={AlertTriangle}>
              <HazardPanel />
            </Panel>
          </div>
        </div>
      ) : (
        <AstronautMode route={activeRoute} />
      )}
    </div>
  );
}
