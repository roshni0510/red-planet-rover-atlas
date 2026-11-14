import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

// OpenLayers needs the browser; load it only on the client.
const MarsMap = lazy(() => import("../MarsMap"));

function MapFallback({ className = "" }) {
  return (
    <div className={`grid place-items-center rounded-md border border-border map-canvas ${className}`}>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" /> Loading map…
      </span>
    </div>
  );
}

export default function LazyMarsMap(props) {
  return (
    <ClientOnly fallback={<MapFallback className={props.className} />}>
      <Suspense fallback={<MapFallback className={props.className} />}>
        <MarsMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
