/**
 * MarsWalk — centralized API service (Axios).
 *
 * Every backend call in the frontend goes through this file.
 *
 * CONTRACT STATUS
 * ---------------
 * The backend (Person 3) is still being developed. Only `POST /api/assistant`
 * has been named so far. Every other endpoint path, request field and layer
 * source below is intentionally `null` until the backend team confirms it.
 * A `null` value makes the matching panel show "Endpoint pending" instead of
 * guessing a URL or response format. Fill these in ONLY with agreed values.
 */
import axios from "axios";

/** Backend base URL, e.g. VITE_API_BASE_URL=https://marswalk-backend.example */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

/** Endpoint paths. `null` = not yet agreed with the backend team. */
export const ENDPOINTS = {
  mission: null, // mission name, location, expedition objective
  datasets: null, // available datasets
  targets: null, // scientific / geological targets
  routeStatus: null, // current route status
  terrainRisk: null, // terrain risk indicators
  hazards: null, // mapped hazards
  environment: null, // environmental observations
  routeOptions: null, // start / destination candidates and route modes
  calculateRoute: null, // route calculation
  observations: null, // rover photographs + observation details (instrument, sol)
  meda: null, // MEDA environmental time series
  rimfax: null, // RIMFAX information
  reports: null, // list of expedition reports
  generateReport: null, // generate an expedition report
  assistant: "/api/assistant", // agreed: POST /api/assistant
};

/**
 * Request body field names. `null` = not yet agreed.
 * While null, the matching action stays disabled with an explanation.
 */
export const REQUEST_FIELDS = {
  assistant: { question: null },
  route: { start: null, destination: null, mode: null },
};

/**
 * Map layer sources (datasets: HiRISE, CTX, DEM, geology, plus derived layers).
 * `url: null` = source not yet provided by the backend.
 *
 * Raster layers: `sourceType` "xyz" (tile URL template with {z}/{x}/{y}) or "wms".
 * Vector layers: GeoJSON URL. `dataProjection` names the CRS of the GeoJSON
 * coordinates (default: Mars 2000 geographic lon/lat, see MarsMap projection).
 */
export const MAP_LAYERS = [
  { id: "hirise", label: "HiRISE imagery", kind: "raster", sourceType: null, url: null, wmsLayer: null, legendUrl: null },
  { id: "ctx", label: "CTX imagery", kind: "raster", sourceType: null, url: null, wmsLayer: null, legendUrl: null },
  { id: "elevation", label: "Elevation (DEM)", kind: "raster", sourceType: null, url: null, wmsLayer: null, legendUrl: null },
  { id: "slope", label: "Slope", kind: "raster", sourceType: null, url: null, wmsLayer: null, legendUrl: null },
  { id: "roughness", label: "Roughness", kind: "raster", sourceType: null, url: null, wmsLayer: null, legendUrl: null },
  { id: "geology", label: "Geological units", kind: "vector", style: "geology", url: null, dataProjection: null, legendUrl: null },
  { id: "hazards", label: "Hazards", kind: "vector", style: "hazard", url: null, dataProjection: null, legendUrl: null },
  { id: "targets", label: "Scientific targets", kind: "vector", style: "target", url: null, dataProjection: null, legendUrl: null },
  { id: "observations", label: "Rover observations", kind: "vector", style: "observation", url: null, dataProjection: null, legendUrl: null },
  { id: "routes", label: "Calculated routes", kind: "route", style: "route", url: null, legendUrl: null },
];

/** Normalised error with a `kind` the UI can explain to the user. */
export class ApiError extends Error {
  /**
   * @param {"endpoint_pending"|"not_configured"|"request_format_pending"|"backend_unavailable"|"timeout"|"http_error"|"invalid_response"} kind
   */
  constructor(kind, message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.details = details;
  }
}

const client = axios.create({
  timeout: 20000,
  headers: { Accept: "application/json" },
});

export function resolveUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return null;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function endpointStatus(key) {
  if (!ENDPOINTS[key]) return "endpoint_pending";
  if (!resolveUrl(ENDPOINTS[key])) return "not_configured";
  return "ready";
}

async function request(key, { method = "get", data, params } = {}) {
  const path = ENDPOINTS[key];
  if (!path) {
    throw new ApiError("endpoint_pending", `The "${key}" endpoint has not been agreed with the backend yet.`, { key });
  }
  const url = resolveUrl(path);
  if (!url) {
    throw new ApiError("not_configured", "Backend URL is not configured (VITE_API_BASE_URL).", { key });
  }

  try {
    const res = await client.request({ url, method, data, params });
    return parseBody(res, key);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
        throw new ApiError("timeout", "The backend did not respond in time.", { key, url });
      }
      if (err.response) {
        const body = err.response.data;
        const serverMessage =
          body && typeof body === "object" && (body.detail || body.message || body.error);
        throw new ApiError(
          "http_error",
          `Backend returned ${err.response.status}${serverMessage ? `: ${typeof serverMessage === "string" ? serverMessage : JSON.stringify(serverMessage)}` : ""}`,
          { key, url, status: err.response.status, body },
        );
      }
      throw new ApiError("backend_unavailable", "Backend is unreachable. Check that it is running and allows requests from this app (CORS).", { key, url });
    }
    throw new ApiError("invalid_response", err?.message || "Unexpected error.", { key });
  }
}

function parseBody(res, key) {
  const body = res.data;
  if (body === "" || body === null || body === undefined) return null;
  if (typeof body === "string") {
    const ct = String(res.headers?.["content-type"] || "");
    if (ct.includes("text/html") || body.trim().startsWith("<")) {
      throw new ApiError("invalid_response", "Backend returned HTML instead of JSON. The endpoint path may be wrong.", { key });
    }
    try {
      return JSON.parse(body);
    } catch {
      throw new ApiError("invalid_response", "Backend returned a response that is not valid JSON.", { key });
    }
  }
  if (typeof body !== "object") {
    throw new ApiError("invalid_response", "Backend returned an unexpected response type.", { key });
  }
  return body;
}

/** Build a request body from agreed field names, or throw if not agreed yet. */
function buildBody(group, values) {
  const fields = REQUEST_FIELDS[group];
  const body = {};
  for (const [name, fieldKey] of Object.entries(fields)) {
    if (!fieldKey) {
      throw new ApiError("request_format_pending", `The request format for "${group}" has not been agreed with the backend yet.`, { group, missing: name });
    }
    if (values[name] !== undefined && values[name] !== null && values[name] !== "") body[fieldKey] = values[name];
  }
  return body;
}

export function requestFormatReady(group) {
  return Object.values(REQUEST_FIELDS[group]).every(Boolean);
}

/** Fetch a GeoJSON layer source (used by the map). */
export async function fetchGeoJSON(url) {
  const full = resolveUrl(url);
  if (!full) throw new ApiError("not_configured", "Layer source is not configured.");
  try {
    const res = await client.get(full);
    const body = parseBody(res, "layer");
    if (!body || (body.type !== "FeatureCollection" && body.type !== "Feature")) {
      throw new ApiError("invalid_response", "Layer source did not return GeoJSON.");
    }
    return body;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("backend_unavailable", "Layer source is unreachable.", { url: full });
  }
}

export const api = {
  getMission: () => request("mission"),
  getDatasets: () => request("datasets"),
  getTargets: () => request("targets"),
  getRouteStatus: () => request("routeStatus"),
  getTerrainRisk: () => request("terrainRisk"),
  getHazards: () => request("hazards"),
  getEnvironment: () => request("environment"),
  getRouteOptions: () => request("routeOptions"),
  calculateRoute: async (values) => request("calculateRoute", { method: "post", data: buildBody("route", values) }),
  getObservations: () => request("observations"),
  getMeda: () => request("meda"),
  getRimfax: () => request("rimfax"),
  getReports: () => request("reports"),
  generateReport: () => request("generateReport", { method: "post" }),
  askAssistant: async (question) => request("assistant", { method: "post", data: buildBody("assistant", { question }) }),
};

export default api;
