import type { LonLat, Region } from '@/types/atlas';
import type { Projector, Viewport } from './projection';

export function tracePolygon(
  ctx: CanvasRenderingContext2D,
  polygon: LonLat[],
  projector: Projector,
  scale = 1,
): void {
  const [first, ...rest] = polygon;
  if (!first) return;
  ctx.moveTo(projector.px(first[0]) * scale, projector.py(first[1]) * scale);
  for (const [lon, lat] of rest) {
    ctx.lineTo(projector.px(lon) * scale, projector.py(lat) * scale);
  }
  ctx.closePath();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Nearest region to a device-pixel point, by squared screen distance. Regions
 * are points rather than areas, so proximity is the whole hit test.
 */
export function nearestRegion(
  regions: Region[],
  projector: Projector,
  view: Viewport,
  x: number,
  y: number,
): Region | null {
  let best: Region | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const region of regions) {
    const dx = projector.sx(projector.px(region.coordinates.lon), view) - x;
    const dy = projector.sy(projector.py(region.coordinates.lat), view) - y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = region;
    }
  }

  return best;
}
