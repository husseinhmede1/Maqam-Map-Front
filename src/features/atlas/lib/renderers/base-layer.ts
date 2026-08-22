import type { LandGeometry } from '@/types/atlas';
import type { Projector, Viewport } from '../projection';
import type { WorldLayer } from '../world-layer';
import { canvasTheme } from '../theme';

export interface BaseLayerFrame {
  ctx: CanvasRenderingContext2D;
  world: WorldLayer;
  land: LandGeometry;
  projector: Projector;
  view: Viewport;
  dpr: number;
}

/**
 * Draws the coloured landmass plus coastlines. Runs only when the view changes
 * (pan, zoom, resize) — never inside the animation loop.
 */
export function drawBaseLayer({ ctx, world, land, projector, view, dpr }: BaseLayerFrame): void {
  const { width, height } = projector;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = canvasTheme.ocean;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.setTransform(view.k, 0, 0, view.k, view.tx, view.ty);
  ctx.drawImage(world.canvas, 0, 0, width, height);

  // Vector coastlines, drawn in screen space so they stay 1px at any zoom.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = canvasTheme.coastline;
  ctx.lineWidth = dpr;
  ctx.beginPath();
  for (const polygon of land.polygons) {
    const [first, ...rest] = polygon;
    if (!first) continue;
    ctx.moveTo(
      projector.sx(projector.px(first[0]), view),
      projector.sy(projector.py(first[1]), view),
    );
    for (const [lon, lat] of rest) {
      ctx.lineTo(projector.sx(projector.px(lon), view), projector.sy(projector.py(lat), view));
    }
    ctx.closePath();
  }
  ctx.stroke();
}
