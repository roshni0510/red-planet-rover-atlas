import { Camera, LineChart as ChartIcon, Mountain, Radar } from "lucide-react";
import Panel from "@/components/common/Panel";
import DataState from "@/components/common/DataState";
import DataView from "@/components/common/DataView";
import SafeImage from "@/components/common/SafeImage";
import SeriesChart from "@/components/common/SeriesChart";
import TargetDetails from "@/components/TargetDetails";
import { api } from "@/services/api";
import { useApiQuery } from "@/services/useApiQuery";
import { findImageUrl, labelOf, toList } from "@/services/dataUtils";

function ObservationGrid({ items }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((o, i) => {
        const img = findImageUrl(o);
        return (
          <li key={i} className="overflow-hidden rounded-md border border-border bg-surface">
            <SafeImage src={img} alt={labelOf(o, i)} className="aspect-[4/3] w-full" />
            <div className="px-3 py-2.5">
              <p className="mb-1.5 truncate text-sm font-medium">{labelOf(o, i)}</p>
              {o && typeof o === "object" && <DataView data={o} depth={1} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Science() {
  const targets = useApiQuery("targets", api.getTargets);
  const observations = useApiQuery("observations", api.getObservations);
  const meda = useApiQuery("meda", api.getMeda);
  const rimfax = useApiQuery("rimfax", api.getRimfax);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <Panel title="Geological targets" icon={Mountain}>
        <DataState query={targets} emptyText="No geological targets returned by the backend.">
          {(data) => {
            const list = toList(data);
            return list ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((t, i) => (
                  <TargetDetails key={i} properties={t && typeof t === "object" ? t : { value: t }} />
                ))}
              </div>
            ) : (
              <DataView data={data} />
            );
          }}
        </DataState>
      </Panel>

      <Panel title="Rover photographs & observations" icon={Camera}>
        <DataState query={observations} emptyText="No rover observations returned by the backend.">
          {(data) => {
            const list = toList(data);
            return list ? <ObservationGrid items={list} /> : <DataView data={data} />;
          }}
        </DataState>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="MEDA environmental data" icon={ChartIcon}>
          <DataState query={meda} emptyText="No MEDA records returned by the backend.">
            {(data) => {
              const list = toList(data);
              return list ? <SeriesChart records={list} /> : <DataView data={data} />;
            }}
          </DataState>
        </Panel>

        <Panel title="RIMFAX" icon={Radar}>
          <DataState query={rimfax} emptyText="No RIMFAX information returned by the backend.">
            {(data) => {
              const list = toList(data);
              const img = !Array.isArray(data) ? findImageUrl(data) : null;
              return (
                <div className="space-y-3">
                  {img && <SafeImage src={img} alt="RIMFAX" className="max-h-72 w-full rounded-md border border-border object-contain" />}
                  <DataView data={list ?? data} />
                </div>
              );
            }}
          </DataState>
        </Panel>
      </div>
    </div>
  );
}
