/**
 * Shape-tolerant helpers for rendering backend JSON.
 * These do NOT compute or derive scientific values — they only find and
 * display what the backend returned, since response formats are not final.
 */

export function isEmptyData(data) {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data).length === 0;
  if (typeof data === "string") return data.trim() === "";
  return false;
}

/** Return the array inside a response: the response itself, or its only array field. */
export function toList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
      return data.features.map((f) => f.properties || {});
    }
    const arrays = Object.values(data).filter(Array.isArray);
    if (arrays.length === 1) return arrays[0];
  }
  return null;
}

/** Display label for an item, using whatever naming field the backend sent. */
export function labelOf(item, index = 0) {
  if (item === null || item === undefined) return `Item ${index + 1}`;
  if (typeof item !== "object") return String(item);
  for (const key of ["name", "label", "title", "id"]) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") return String(item[key]);
  }
  return `Item ${index + 1}`;
}

export function humanizeKey(key) {
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

const GEOJSON_TYPES = new Set([
  "FeatureCollection",
  "Feature",
  "LineString",
  "MultiLineString",
  "Point",
  "MultiPoint",
  "Polygon",
  "MultiPolygon",
]);

/** Find the first GeoJSON object inside a backend response (depth-limited). */
export function findGeoJSON(data, depth = 0) {
  if (!data || typeof data !== "object" || depth > 4) return null;
  if (typeof data.type === "string" && GEOJSON_TYPES.has(data.type) && (data.features || data.geometry || data.coordinates)) {
    return data;
  }
  for (const value of Object.values(data)) {
    const found = findGeoJSON(value, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Extract an ordered list of [lon, lat] vertices from a GeoJSON line (if any). */
export function lineVertices(geojson) {
  if (!geojson) return [];
  const geom =
    geojson.type === "FeatureCollection"
      ? (geojson.features || []).map((f) => f.geometry).find((g) => g && /LineString/.test(g.type))
      : geojson.type === "Feature"
        ? geojson.geometry
        : geojson;
  if (!geom) return [];
  if (geom.type === "LineString") return geom.coordinates || [];
  if (geom.type === "MultiLineString") return (geom.coordinates || []).flat();
  return [];
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|tiff?)(\?.*)?$/i;

/** Find an image URL in an observation record. */
export function findImageUrl(item) {
  if (!item || typeof item !== "object") return null;
  for (const [key, value] of Object.entries(item)) {
    if (typeof value !== "string") continue;
    if (/^https?:\/\//i.test(value) && (IMAGE_EXT.test(value) || /image|img|thumb|photo/i.test(key))) return value;
  }
  return null;
}

/** For tabular records: pick an x-axis key and the numeric series keys. */
export function seriesKeys(records) {
  if (!Array.isArray(records) || records.length === 0 || typeof records[0] !== "object") {
    return { xKey: null, yKeys: [] };
  }
  const keys = Object.keys(records[0]);
  const numeric = keys.filter((k) => records.some((r) => typeof r?.[k] === "number"));
  const xKey =
    keys.find((k) => /^(sol|time|date|timestamp|utc|lmst|ltst)$/i.test(k)) ||
    keys.find((k) => !numeric.includes(k)) ||
    numeric[0] ||
    null;
  return { xKey, yKeys: numeric.filter((k) => k !== xKey) };
}
