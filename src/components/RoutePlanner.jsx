import { useState } from "react";
import { Crosshair, GitCompare, Loader2, MapPin, Route as RouteIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, endpointStatus, requestFormatReady } from "@/services/api";
import { useApiQuery } from "@/services/useApiQuery";
import { findGeoJSON, labelOf, toList } from "@/services/dataUtils";
import { StateMessage, LoadingState } from "./common/DataState";
import DataView from "./common/DataView";

export function formatLonLat(lonLat) {
  if (!Array.isArray(lonLat)) return "";
  const [lon, lat] = lonLat;
  return `${Math.abs(lat).toFixed(5)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(5)}°${lon >= 0 ? "E" : "W"}`;
}

/** Hide raw GeoJSON geometry in result cards (it is drawn on the map instead). */
function stripGeometry(result) {
  const geo = findGeoJSON(result);
  if (!geo || !result || typeof result !== "object") return result;
  return Object.fromEntries(Object.entries(result).filter(([, v]) => v !== geo));
}

/** Start/destination: a backend target, or a point picked on the map. */
function PointField({ label, value, onChange, targets, onRequestPick, picking }) {
  const selectValue = value?.type === "target" ? `t:${value.index}` : value?.type === "map" ? "map" : "";
  return (
    <div>
      <label className="label-caps mb-1.5 block">{label}</label>
      <div className="flex gap-2">
        <select
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith("t:")) {
              const index = Number(v.slice(2));
              const item = targets[index];
              onChange({ type: "target", index, label: labelOf(item, index), value: item?.id ?? labelOf(item, index) });
            } else onChange(null);
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{targets.length ? "Select a target…" : "No targets from backend"}</option>
          {targets.map((t, i) => (
            <option key={i} value={`t:${i}`}>
              {labelOf(t, i)}
            </option>
          ))}
          {value?.type === "map" && <option value="map">Map point: {formatLonLat(value.lonLat)}</option>}
        </select>
        <Button type="button" variant={picking ? "default" : "outline"} size="icon" onClick={onRequestPick} aria-label={`Pick ${label.toLowerCase()} on map`} title="Pick on map">
          <Crosshair />
        </Button>
      </div>
    </div>
  );
}

export function RouteResultCard({ result, index, active, compared, onShow, onCompare, onRemove }) {
  return (
    <article className={`rounded-md border bg-surface ${active ? "border-primary" : "border-border"}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="label-caps">Route {index + 1}</p>
          <p className="truncate text-xs text-muted-foreground">
            {result.request.start?.label} → {result.request.destination?.label}
            {result.request.mode ? ` · ${result.request.mode}` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={active ? "default" : "outline"} onClick={onShow} disabled={!result.geojson} title={result.geojson ? "Show on map" : "No geometry returned"}>
            <MapPin /> Map
          </Button>
          <Button size="sm" variant={compared ? "secondary" : "ghost"} onClick={onCompare} aria-pressed={compared}>
            <GitCompare /> Compare
          </Button>
          <Button size="icon" variant="ghost" className="size-8" onClick={onRemove} aria-label="Remove route">
            <Trash2 />
          </Button>
        </div>
      </header>
      <div className="max-h-96 overflow-y-auto px-3 py-2.5">
        <DataView data={stripGeometry(result.data)} />
      </div>
    </article>
  );
}

/**
 * Route planner. All route values (distance, risk, waypoints, hazards,
 * targets, explanation) come from the backend's route calculation.
 */
export default function RoutePlanner({ points, setPoint, pickMode, setPickMode, results, setResults, activeId, setActiveId, compareIds, setCompareIds }) {
  const targetsQuery = useApiQuery("targets", api.getTargets);
  const optionsQuery = useApiQuery("routeOptions", api.getRouteOptions);
  const [mode, setMode] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const targets = toList(targetsQuery.data) || [];
  const optionsData = optionsQuery.data;
  const modes = Array.isArray(optionsData)
    ? optionsData
    : optionsData && typeof optionsData === "object"
      ? Object.entries(optionsData).find(([k, v]) => /mode/i.test(k) && Array.isArray(v))?.[1] || []
      : [];

  const calcStatus = endpointStatus("calculateRoute");
  const blocker = calcStatus !== "ready" ? calcStatus : !requestFormatReady("route") ? "request_format_pending" : null;
  const canRun = !blocker && points.start && points.destination && !running;

  async function calculate() {
    setError(null);
    setRunning(true);
    const pointValue = (p) => (p?.type === "map" ? p.lonLat : p?.value);
    try {
      const data = await api.calculateRoute({ start: pointValue(points.start), destination: pointValue(points.destination), mode: mode || undefined });
      if (data === null) throw Object.assign(new Error("The backend returned an empty route."), { kind: "invalid_response" });
      const id = `${Date.now()}`;
      setResults((r) => [...r, { id, data, geojson: findGeoJSON(data), request: { start: points.start, destination: points.destination, mode: mode ? labelOf(modes.find((m) => String(m?.id ?? labelOf(m)) === mode) ?? mode) : "" } }]);
      setActiveId(id);
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  }

  const compared = results.filter((r) => compareIds.includes(r.id));

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {targetsQuery.readiness !== "ready" && <StateMessage kind={targetsQuery.readiness} message="Target list not connected — you can still pick points on the map." compact />}
        {targetsQuery.isPending && targetsQuery.readiness === "ready" && <LoadingState text="Loading targets…" />}
        <PointField
          label="Starting point"
          value={points.start}
          onChange={(v) => setPoint("start", v)}
          targets={targets}
          picking={pickMode === "starting point"}
          onRequestPick={() => setPickMode(pickMode === "starting point" ? null : "starting point")}
        />
        <PointField
          label="Destination"
          value={points.destination}
          onChange={(v) => setPoint("destination", v)}
          targets={targets}
          picking={pickMode === "destination"}
          onRequestPick={() => setPickMode(pickMode === "destination" ? null : "destination")}
        />
        <div>
          <label className="label-caps mb-1.5 block">Route mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={modes.length === 0}
            className="h-9 w-full rounded-md border border-input bg-surface px-2 text-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{modes.length ? "Select a mode…" : "Modes provided by backend (not connected)"}</option>
            {modes.map((m, i) => (
              <option key={i} value={String(m?.id ?? labelOf(m, i))}>
                {labelOf(m, i)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {blocker && <StateMessage kind={blocker} />}
      <Button className="w-full" onClick={calculate} disabled={!canRun}>
        {running ? <Loader2 className="animate-spin" /> : <RouteIcon />}
        {running ? "Calculating…" : "Calculate route"}
      </Button>
      {error && <StateMessage kind={error.kind} message={error.message} />}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="label-caps">Calculated routes</p>
          {results.map((r, i) => (
            <RouteResultCard
              key={r.id}
              result={r}
              index={i}
              active={r.id === activeId}
              compared={compareIds.includes(r.id)}
              onShow={() => setActiveId(r.id)}
              onCompare={() =>
                setCompareIds((ids) => (ids.includes(r.id) ? ids.filter((x) => x !== r.id) : [...ids, r.id].slice(-2)))
              }
              onRemove={() => {
                setResults((rs) => rs.filter((x) => x.id !== r.id));
                setCompareIds((ids) => ids.filter((x) => x !== r.id));
                if (activeId === r.id) setActiveId(null);
              }}
            />
          ))}
        </div>
      )}

      {compared.length === 2 && (
        <div>
          <p className="label-caps mb-2">Route comparison</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {compared.map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-surface p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Route {results.indexOf(r) + 1}: {r.request.start?.label} → {r.request.destination?.label}
                </p>
                <DataView data={stripGeometry(r.data)} />
              </div>
            ))}
          </div>
        </div>
      )}
      {compared.length === 1 && <p className="text-xs text-muted-foreground">Select one more route to compare.</p>}
    </div>
  );
}
