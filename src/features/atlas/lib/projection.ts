import type { Projection } from '@/types/atlas';

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 9;

/** Zoom + translation, expressed in device (canvas) pixels. */
export interface Viewport {
  k: number;
  tx: number;
  ty: number;
}

export const IDENTITY_VIEWPORT: Viewport = { k: 1, tx: 0, ty: 0 };

export interface Projector {
  /** Longitude → canvas x, before the viewport transform. */
  px: (lon: number) => number;
  /** Latitude → canvas y, before the viewport transform. */
  py: (lat: number) => number;
  /** Applies the viewport to an already-projected coordinate. */
  sx: (x: number, view: Viewport) => number;
  sy: (y: number, view: Viewport) => number;
  width: number;
  height: number;
}

/**
 * Equirectangular projection — deliberately simple. The map is a colour field,
 * not a survey instrument, and a plate carrée keeps the pixel maths trivial.
 */
export function createProjector(projection: Projection, width: number, height: number): Projector {
  const { lon0, lon1, lat0, lat1 } = projection;
  const lonSpan = lon1 - lon0;
  const latSpan = lat1 - lat0;

  return {
    width,
    height,
    px: (lon) => ((lon - lon0) / lonSpan) * width,
    py: (lat) => ((lat1 - lat) / latSpan) * height,
    sx: (x, view) => x * view.k + view.tx,
    sy: (y, view) => y * view.k + view.ty,
  };
}

export function clampZoom(k: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k));
}

/** Keeps the map from being panned away from the viewport edges. */
export function clampViewport(view: Viewport, width: number, height: number): Viewport {
  const k = clampZoom(view.k);
  return {
    k,
    tx: Math.min(0, Math.max(width - width * k, view.tx)),
    ty: Math.min(0, Math.max(height - height * k, view.ty)),
  };
}

/** Zooms by `factor` while keeping the point (`x`, `y`) anchored under the cursor. */
export function zoomAt(
  view: Viewport,
  x: number,
  y: number,
  factor: number,
  width: number,
  height: number,
): Viewport {
  const k = clampZoom(view.k * factor);
  const applied = k / view.k;
  return clampViewport(
    { k, tx: x - (x - view.tx) * applied, ty: y - (y - view.ty) * applied },
    width,
    height,
  );
}
