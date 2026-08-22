import type { HistoricRoute, Locale, Region } from '@/types/atlas';
import type { Projector, Viewport } from '../projection';
import { roundRect } from '../geometry';
import { canvasTheme, detailThresholds } from '../theme';

export interface OverlayFrame {
  ctx: CanvasRenderingContext2D;
  regions: Region[];
  routes: HistoricRoute[];
  visibleRouteIds: ReadonlySet<string>;
  projector: Projector;
  view: Viewport;
  dpr: number;
  locale: Locale;
  selectedRegionId: string | null;
  /** Animation phases; both are frozen when the user prefers reduced motion. */
  pulse: number;
  dashOffset: number;
  reducedMotion: boolean;
}

/**
 * Draws routes, region markers and labels. Repainted every animation frame,
 * which is why it lives on its own canvas above the (static) base layer.
 */
export function drawOverlayLayer(frame: OverlayFrame): void {
  const { ctx, projector } = frame;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, projector.width, projector.height);
  drawRoutes(frame);
  drawRegions(frame);
  drawSelectedCallout(frame);
}

function drawRoutes(frame: OverlayFrame): void {
  const { ctx, routes, visibleRouteIds, projector, view, dpr, locale, dashOffset } = frame;

  for (const route of routes) {
    if (!visibleRouteIds.has(route.id)) continue;

    for (const path of route.paths) {
      const points = path.map(
        ([lon, lat]) =>
          [projector.sx(projector.px(lon), view), projector.sy(projector.py(lat), view)] as const,
      );
      const first = points[0];
      const last = points[points.length - 1];
      if (!first || !last) continue;

      ctx.beginPath();
      ctx.moveTo(first[0], first[1]);
      // Quadratic segments through midpoints: a smooth caravan trail, not a zig-zag.
      for (let i = 1; i < points.length - 1; i += 1) {
        const current = points[i];
        const next = points[i + 1];
        if (!current || !next) continue;
        ctx.quadraticCurveTo(
          current[0],
          current[1],
          (current[0] + next[0]) / 2,
          (current[1] + next[1]) / 2,
        );
      }
      ctx.lineTo(last[0], last[1]);

      ctx.setLineDash([]);
      ctx.strokeStyle = `${route.color}2E`;
      ctx.lineWidth = 5 * dpr;
      ctx.stroke();

      ctx.setLineDash([7 * dpr, 6 * dpr]);
      ctx.lineDashOffset = -dashOffset * dpr;
      ctx.strokeStyle = route.color;
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (view.k >= detailThresholds.routeLabels) {
      const primaryPath = route.paths[0];
      const midpoint = primaryPath?.[Math.floor(primaryPath.length / 2)];
      if (!midpoint) continue;
      const x = projector.sx(projector.px(midpoint[0]), view);
      const y = projector.sy(projector.py(midpoint[1]), view);
      if (x <= 0 || x >= projector.width || y <= 0 || y >= projector.height) continue;

      const label = route.translations[locale].name;
      ctx.font = `${10.5 * dpr}px ${canvasTheme.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3 * dpr;
      ctx.strokeStyle = canvasTheme.labelHalo;
      ctx.strokeText(label, x, y - 6 * dpr);
      ctx.fillStyle = route.color;
      ctx.fillText(label, x, y - 6 * dpr);
    }
  }
}

function drawRegions(frame: OverlayFrame): void {
  const { ctx, regions, projector, view, dpr, locale, selectedRegionId, pulse, reducedMotion } =
    frame;
  const showLabels = view.k >= detailThresholds.regionLabels;
  const margin = 30 * dpr;

  for (const region of regions) {
    const x = projector.sx(projector.px(region.coordinates.lon), view);
    const y = projector.sy(projector.py(region.coordinates.lat), view);
    if (x < -margin || x > projector.width + margin) continue;
    if (y < -margin || y > projector.height + margin) continue;

    const isSelected = region.id === selectedRegionId;

    if (isSelected) {
      const pulseRadius = (6 + (reducedMotion ? 2 : 3 * Math.sin(pulse))) * dpr;
      ctx.beginPath();
      ctx.arc(x, y, 7 * dpr + pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = region.color;
      ctx.lineWidth = 1.6 * dpr;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(x, y, (isSelected ? 4.6 : 2.7) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = canvasTheme.markerRing;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, (isSelected ? 3.1 : 1.7) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = canvasTheme.markerCore;
    ctx.fill();

    if (showLabels && !isSelected) {
      const label = region.translations[locale].name;
      ctx.font = `${10.5 * dpr}px ${canvasTheme.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3 * dpr;
      ctx.strokeStyle = canvasTheme.labelHalo;
      ctx.strokeText(label, x, y - 7 * dpr);
      ctx.fillStyle = canvasTheme.labelFill;
      ctx.fillText(label, x, y - 7 * dpr);
    }
  }
}

function drawSelectedCallout(frame: OverlayFrame): void {
  const { ctx, regions, projector, view, dpr, locale, selectedRegionId } = frame;
  const selected = regions.find((region) => region.id === selectedRegionId);
  if (!selected) return;

  const x = projector.sx(projector.px(selected.coordinates.lon), view);
  const y = projector.sy(projector.py(selected.coordinates.lat), view);
  if (x < -50 || x > projector.width + 50 || y < -50 || y > projector.height + 50) return;

  const label = selected.translations[locale].name;
  ctx.font = `${12.5 * dpr}px ${canvasTheme.fontFamily}`;
  ctx.textAlign = 'center';
  const width = ctx.measureText(label).width + 16 * dpr;
  // Flip below the marker when the callout would clip the top edge.
  const labelY = y > 44 * dpr ? y - 19 * dpr : y + 28 * dpr;

  ctx.fillStyle = canvasTheme.calloutFill;
  ctx.strokeStyle = canvasTheme.calloutStroke;
  ctx.lineWidth = 1;
  roundRect(ctx, x - width / 2, labelY - 12 * dpr, width, 18 * dpr, 9 * dpr);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = canvasTheme.calloutText;
  ctx.fillText(label, x, labelY + 1.5 * dpr);
}
