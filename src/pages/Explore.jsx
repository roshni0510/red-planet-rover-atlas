import { useCallback, useState } from "react";
import { Layers } from "lucide-react";
import Panel from "@/components/common/Panel";
import LayerPanel from "@/components/LayerPanel";
import LazyMarsMap from "@/components/map/LazyMarsMap";

export default function Explore() {
  const [visibility, setVisibility] = useState({});
  const [statuses, setStatuses] = useState({});

  const onLayerStatus = useCallback((id, status) => setStatuses((s) => ({ ...s, [id]: status })), []);
  const toggle = (id) => setVisibility((v) => ({ ...v, [id]: v[id] === false }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <LazyMarsMap className="h-[60vh] lg:h-[calc(100vh-7.5rem)]" visibility={visibility} onLayerStatus={onLayerStatus} />
      <Panel title="Layers & legend" icon={Layers} bodyClassName="overflow-y-auto">
        <LayerPanel visibility={visibility} onToggle={toggle} statuses={statuses} />
        <p className="mt-4 border-t border-border pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Projection: Mars 2000 equidistant cylindrical (IAU_2015:49910). Click a marker to view its details.
        </p>
      </Panel>
    </div>
  );
}
