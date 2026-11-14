import { AlertTriangle } from "lucide-react";
import { api } from "@/services/api";
import { useApiQuery } from "@/services/useApiQuery";
import { labelOf, toList } from "@/services/dataUtils";
import DataState, { EmptyState } from "./common/DataState";
import DataView from "./common/DataView";

function HazardList({ items }) {
  if (!items || items.length === 0) return <EmptyState text="No hazards returned by the backend." />;
  return (
    <ul className="space-y-2">
      {items.map((h, i) => (
        <li key={i} className="rounded border border-border border-l-2 border-l-destructive bg-surface px-3 py-2">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="size-3.5 text-destructive" aria-hidden /> {labelOf(h, i)}
          </p>
          {h && typeof h === "object" && <DataView data={h} depth={1} hideKeys={["geometry"]} />}
        </li>
      ))}
    </ul>
  );
}

/**
 * Mapped hazards. Pass `items` to show hazards from a route result;
 * otherwise loads the hazards endpoint.
 */
export default function HazardPanel({ items }) {
  if (items !== undefined) return <HazardList items={items} />;
  return <HazardsFromBackend />;
}

function HazardsFromBackend() {
  const query = useApiQuery("hazards", api.getHazards);
  return (
    <DataState query={query} emptyText="No hazards returned by the backend.">
      {(data) => {
        const list = toList(data);
        return list ? <HazardList items={list} /> : <DataView data={data} />;
      }}
    </DataState>
  );
}
