import { useEffect, useRef, useState } from "react";
import OlMap from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import ImageWMS from "ol/source/ImageWMS";
import GeoJSON from "ol/format/GeoJSON";
import { createXYZ } from "ol/tilegrid";
import { defaults as defaultControls, MousePosition, ScaleLine } from "ol/control";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { transform } from "ol/proj";
import { isEmpty as extentIsEmpty } from "ol/extent";
import { Crosshair, Layers } from "lucide-react";
import { fetchGeoJSON, MAP_LAYERS } from "@/services/api";
import { MARS_EQC, MARS_EQC_EXTENT, MARS_GEO, registerMarsProjections } from "./map/marsProjection";
import TargetDetails from "./TargetDetails";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function withAlpha(color, alpha) {
  return color.startsWith("oklch(") ? color.replace(/\)\s*$/, ` / ${alpha})`) : color;
}

function makeStyles() {
  const c = {
    route: cssVar("--map-route"),
    hazard: cssVar("--map-hazard"),
    target: cssVar("--map-target"),
    observation: cssVar("--map-observation"),
    geology: cssVar("--map-geology"),
    halo: cssVar("--map-canvas"),
  };
  const point = (color, radius = 6) =>
    new Style({
      image: new CircleStyle({ radius, fill: new Fill({ color }), stroke: new Stroke({ color: c.halo, width: 2 }) }),
      stroke: new Stroke({ color, width: 2 }),
      fill: new Fill({ color: withAlpha(color, 0.25) }),
    });
  return {
    target: point(c.target, 6),
    hazard: point(c.hazard, 6),
    observation: point(c.observation, 5),
    geology: new Style({ stroke: new Stroke({ color: c.geology, width: 1.2 }), fill: new Fill({ color: withAlpha(c.geology, 0.12) }) }),
    route: [
      new Style({ stroke: new Stroke({ color: c.halo, width: 6 }) }),
      new Style({ stroke: new Stroke({ color: c.route, width: 3 }) }),
    ],
    routeInactive: new Style({ stroke: new Stroke({ color: withAlpha(c.route, 0.45), width: 2, lineDash: [6, 6] }) }),
    pick: point(c.route, 7),
  };
}

function rasterSource(cfg) {
  if (cfg.sourceType === "xyz") {
    return new XYZ({
      url: cfg.url,
      projection: MARS_EQC,
      tileGrid: createXYZ({ extent: MARS_EQC_EXTENT, tileSize: 256 }),
      crossOrigin: "anonymous",
    });
  }
  if (cfg.sourceType === "wms") {
    return new ImageWMS({ url: cfg.url, params: { LAYERS: cfg.wmsLayer }, projection: MARS_EQC, crossOrigin: "anonymous" });
  }
  return null;
}

/**
 * Interactive Mars map (OpenLayers, Mars 2000 equidistant cylindrical CRS).
 *
 * Props:
 *  visibility: { [layerId]: boolean }
 *  routes: [{ id, geojson, active }]   — route GeoJSON exactly as returned by the backend
 *  pickMode: null | string            — when set, a click reports Mars lon/lat via onPick
 *  onPick(lonLat, pickMode)
 *  picks: [{ id, lonLat }]            — user-selected points to display
 *  onLayerStatus(layerId, status)
 */
export default function MarsMap({ visibility = {}, routes = [], pickMode = null, onPick, picks = [], onLayerStatus, className = "" }) {
  const targetRef = useRef(null);
  const popupRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const routeLayerRef = useRef(null);
  const pickLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const stylesRef = useRef(null);
  const handlersRef = useRef({ pickMode, onPick, onLayerStatus });
  const fittedRef = useRef(false);
  const [selected, setSelected] = useState(null);
  const [connectedCount, setConnectedCount] = useState(0);

  handlersRef.current = { pickMode, onPick, onLayerStatus };

  // Create the map once.
  useEffect(() => {
    registerMarsProjections();
    stylesRef.current = makeStyles();
    const styles = stylesRef.current;
    const report = (id, status) => handlersRef.current.onLayerStatus?.(id, status);

    const olLayers = [];
    let connected = 0;
    for (const cfg of MAP_LAYERS) {
      if (cfg.kind === "route") continue;
      if (!cfg.url) {
        report(cfg.id, { state: "pending" });
        continue;
      }
      connected += 1;
      if (cfg.kind === "raster") {
        const source = rasterSource(cfg);
        if (!source) {
          report(cfg.id, { state: "error", message: "Unsupported raster source type." });
          continue;
        }
        const layer = cfg.sourceType === "wms" ? new ImageLayer({ source }) : new TileLayer({ source });
        let errored = false;
        source.on(cfg.sourceType === "wms" ? "imageloaderror" : "tileloaderror", () => {
          if (!errored) report(cfg.id, { state: "error", message: "Some imagery failed to load." });
          errored = true;
        });
        report(cfg.id, { state: "ready" });
        layer.set("layerId", cfg.id);
        layersRef.current[cfg.id] = layer;
        olLayers.push(layer);
      } else {
        const source = new VectorSource();
        const layer = new VectorLayer({ source, style: styles[cfg.style] });
        layer.set("layerId", cfg.id);
        layersRef.current[cfg.id] = layer;
        olLayers.push(layer);
        report(cfg.id, { state: "loading" });
        fetchGeoJSON(cfg.url)
          .then((geojson) => {
            const features = new GeoJSON().readFeatures(geojson, {
              dataProjection: cfg.dataProjection || MARS_GEO,
              featureProjection: MARS_EQC,
            });
            source.addFeatures(features);
            report(cfg.id, { state: "ready", count: features.length });
            if (!fittedRef.current && features.length && !extentIsEmpty(source.getExtent())) {
              fittedRef.current = true;
              mapRef.current?.getView().fit(source.getExtent(), { padding: [48, 48, 48, 48], maxZoom: 16 });
            }
          })
          .catch((err) => report(cfg.id, { state: "error", message: err?.message }));
      }
    }
    setConnectedCount(connected);

    routeLayerRef.current = new VectorLayer({ source: new VectorSource(), zIndex: 20 });
    routeLayerRef.current.set("layerId", "routes");
    pickLayerRef.current = new VectorLayer({ source: new VectorSource(), style: styles.pick, zIndex: 30 });

    overlayRef.current = new Overlay({
      element: popupRef.current,
      positioning: "bottom-center",
      offset: [0, -12],
      autoPan: { animation: { duration: 200 } },
    });

    const map = new OlMap({
      target: targetRef.current,
      layers: [...olLayers, routeLayerRef.current, pickLayerRef.current],
      overlays: [overlayRef.current],
      controls: defaultControls({ attribution: false }).extend([
        new ScaleLine({ units: "metric" }),
        new MousePosition({
          projection: MARS_GEO,
          className: "mars-mouse-position",
          coordinateFormat: (c) =>
            c ? `${Math.abs(c[1]).toFixed(4)}°${c[1] >= 0 ? "N" : "S"}  ${Math.abs(c[0]).toFixed(4)}°${c[0] >= 0 ? "E" : "W"}` : "",
          placeholder: "Mars lon/lat",
        }),
      ]),
      view: new View({ projection: MARS_EQC, extent: MARS_EQC_EXTENT, constrainOnlyCenter: true, showFullExtent: true }),
    });
    map.getView().fit(MARS_EQC_EXTENT, { size: map.getSize() || [800, 400] });

    map.on("singleclick", (evt) => {
      const { pickMode: mode, onPick: pick } = handlersRef.current;
      if (mode && pick) {
        const lonLat = transform(evt.coordinate, MARS_EQC, MARS_GEO);
        pick(lonLat, mode);
        return;
      }
      let hit = null;
      map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => {
          hit = { feature, layerId: layer?.get("layerId") };
          return true;
        },
        { hitTolerance: 4 },
      );
      if (hit) {
        const { geometry, ...props } = hit.feature.getProperties();
        const layerCfg = MAP_LAYERS.find((l) => l.id === hit.layerId);
        setSelected({ properties: props, layerLabel: layerCfg?.label });
        overlayRef.current.setPosition(evt.coordinate);
      } else {
        setSelected(null);
        overlayRef.current.setPosition(undefined);
      }
    });

    map.on("pointermove", (evt) => {
      if (evt.dragging) return;
      const hasFeature = map.hasFeatureAtPixel(evt.pixel, { hitTolerance: 4 });
      map.getTargetElement().style.cursor = handlersRef.current.pickMode ? "crosshair" : hasFeature ? "pointer" : "";
    });

    mapRef.current = map;
    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(targetRef.current);

    return () => {
      ro.disconnect();
      map.setTarget(undefined);
      mapRef.current = null;
      layersRef.current = {};
    };
  }, []);

  // Layer visibility.
  useEffect(() => {
    for (const [id, layer] of Object.entries(layersRef.current)) {
      layer.setVisible(visibility[id] !== false);
    }
    routeLayerRef.current?.setVisible(visibility.routes !== false);
  }, [visibility]);

  // Routes returned by the backend.
  useEffect(() => {
    const layer = routeLayerRef.current;
    const styles = stylesRef.current;
    if (!layer || !styles) return;
    const source = layer.getSource();
    source.clear();
    const format = new GeoJSON();
    let activeExtentSource = null;
    for (const r of routes) {
      if (!r?.geojson) continue;
      try {
        const features = format.readFeatures(r.geojson, { dataProjection: MARS_GEO, featureProjection: MARS_EQC });
        features.forEach((f) => f.setStyle(r.active ? styles.route : styles.routeInactive));
        source.addFeatures(features);
        if (r.active) activeExtentSource = new VectorSource({ features });
      } catch {
        // Invalid geometry from backend — skipped; the planner shows the raw result.
      }
    }
    if (activeExtentSource && !extentIsEmpty(activeExtentSource.getExtent())) {
      mapRef.current?.getView().fit(activeExtentSource.getExtent(), { padding: [64, 64, 64, 64], maxZoom: 17, duration: 300 });
    }
  }, [routes]);

  // User-picked points (start / destination).
  useEffect(() => {
    const layer = pickLayerRef.current;
    if (!layer) return;
    const source = layer.getSource();
    source.clear();
    const format = new GeoJSON();
    for (const p of picks) {
      if (!p?.lonLat) continue;
      source.addFeature(
        format.readFeature(
          { type: "Feature", properties: { pick: p.id }, geometry: { type: "Point", coordinates: p.lonLat } },
          { dataProjection: MARS_GEO, featureProjection: MARS_EQC },
        ),
      );
    }
  }, [picks]);

  const closePopup = () => {
    setSelected(null);
    overlayRef.current?.setPosition(undefined);
  };

  return (
    <div className={`relative overflow-hidden rounded-md border border-border map-canvas ${className}`}>
      <div ref={targetRef} className="absolute inset-0" aria-label="Mars map" role="application" />

      {connectedCount === 0 && routes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
          <div className="max-w-sm rounded-md border border-border bg-card/95 px-4 py-3 text-center">
            <Layers className="mx-auto mb-2 size-5 text-primary" aria-hidden />
            <p className="text-sm font-medium">No map sources connected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Layers appear here once the backend provides HiRISE, CTX, DEM, geology and other layer sources.
            </p>
          </div>
        </div>
      )}

      {pickMode && (
        <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-primary/50 bg-card/95 px-3 py-1.5 text-xs">
          <Crosshair className="size-3.5 text-primary" aria-hidden />
          Click the map to set the {pickMode}
        </div>
      )}

      <div ref={popupRef} className={selected ? "" : "hidden"}>
        {selected && <TargetDetails properties={selected.properties} layerLabel={selected.layerLabel} onClose={closePopup} compact />}
      </div>
    </div>
  );
}
