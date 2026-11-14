/**
 * Mars coordinate reference systems for OpenLayers.
 *
 * OpenLayers defaults to Earth's Web Mercator (EPSG:3857), which is wrong for
 * Mars. We register two Mars CRSs based on the IAU Mars 2000 sphere:
 *   - IAU_2015:49900  Mars 2000 geographic (lon/lat degrees, planetocentric, east-positive)
 *   - IAU_2015:49910  Mars 2000 Equidistant Cylindrical (metres, standard parallel 0°)
 * The map view uses 49910; GeoJSON from the backend is read as 49900 unless a
 * layer declares a different `dataProjection`.
 *
 * NOTE: confirm with the backend team that the datasets use these CRSs.
 */
import Projection from "ol/proj/Projection";
import { addCoordinateTransforms, addProjection, get as getProjection } from "ol/proj";

export const MARS_RADIUS_M = 3396190; // IAU Mars 2000 reference sphere radius
export const MARS_GEO = "IAU_2015:49900";
export const MARS_EQC = "IAU_2015:49910";

const DEG = Math.PI / 180;
const R = MARS_RADIUS_M;
export const MARS_EQC_EXTENT = [-Math.PI * R, (-Math.PI * R) / 2, Math.PI * R, (Math.PI * R) / 2];

export function registerMarsProjections() {
  if (getProjection(MARS_EQC) && getProjection(MARS_GEO)) return;

  const geo = new Projection({
    code: MARS_GEO,
    units: "degrees",
    extent: [-180, -90, 180, 90],
    worldExtent: [-180, -90, 180, 90],
    global: true,
    metersPerUnit: (2 * Math.PI * R) / 360,
  });

  const eqc = new Projection({
    code: MARS_EQC,
    units: "m",
    extent: MARS_EQC_EXTENT,
    worldExtent: [-180, -90, 180, 90],
    global: true,
    // East-west ground distance per map unit shrinks with cos(latitude).
    getPointResolution: (resolution, point) => resolution * Math.cos(point[1] / R),
  });

  addProjection(geo);
  addProjection(eqc);
  addCoordinateTransforms(
    geo,
    eqc,
    (c) => [c[0] * DEG * R, c[1] * DEG * R],
    (c) => [c[0] / R / DEG, c[1] / R / DEG],
  );
}
