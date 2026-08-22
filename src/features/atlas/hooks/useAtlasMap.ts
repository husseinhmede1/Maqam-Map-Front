import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoricRoute, LandGeometry, Locale, Region } from '@/types/atlas';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { nearestRegion } from '../lib/geometry';
import {
  createProjector,
  clampViewport,
  zoomAt,
  IDENTITY_VIEWPORT,
  type Viewport,
} from '../lib/projection';
import { drawBaseLayer } from '../lib/renderers/base-layer';
import { drawOverlayLayer } from '../lib/renderers/overlay-layer';
import { buildWorldLayer, type WorldLayer } from '../lib/world-layer';
import { useCanvasSurface, type CanvasSurface } from './useCanvasSurface';

export interface AtlasMapInput {
  regions: Region[];
  routes: HistoricRoute[];
  land: LandGeometry;
  visibleRouteIds: string[];
  selectedRegionId: string | null;
  locale: Locale;
  onSelectRegion: (regionId: string) => void;
  /** Fired on a tap/click selection (not on hover), so the page can scroll to the songs. */
  onCommitSelection?: (regionId: string) => void;
}

export interface AtlasMapApi {
  containerRef: React.RefObject<HTMLDivElement | null>;
  baseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  surface: CanvasSurface;
  zoom: number;
  isBuilding: boolean;
  isDragging: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

const ZOOM_STEP = 1.4;
const WHEEL_STEP = 1.18;
const DOUBLE_CLICK_STEP = 1.8;
const DRAG_THRESHOLD_PX = 4;
const PULSE_SPEED = 0.06;
const DASH_SPEED = 0.35;

/**
 * Owns the imperative half of the map.
 *
 * The viewport lives in a ref rather than in state on purpose: a pan emits
 * pointer events at screen refresh rate, and re-rendering React on each one
 * would throw away the frame budget the canvas needs. Only the zoom badge —
 * which humans actually read — is mirrored into state.
 */
export function useAtlasMap({
  regions,
  routes,
  land,
  visibleRouteIds,
  selectedRegionId,
  locale,
  onSelectRegion,
  onCommitSelection,
}: AtlasMapInput): AtlasMapApi {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const surface = useCanvasSurface(containerRef);
  const reducedMotion = usePrefersReducedMotion();

  const [zoom, setZoom] = useState(1);
  const [isBuilding, setIsBuilding] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const viewRef = useRef<Viewport>({ ...IDENTITY_VIEWPORT });
  const worldRef = useRef<WorldLayer | null>(null);

  const projector = useMemo(
    () => createProjector(land.projection, surface.width, surface.height),
    [land.projection, surface.width, surface.height],
  );

  // Latest render inputs, readable from event handlers and the animation loop
  // without re-subscribing them on every prop change.
  const frameRef = useRef({
    regions,
    routes,
    land,
    locale,
    selectedRegionId,
    projector,
    surface,
    reducedMotion,
    visibleRouteIds: new Set(visibleRouteIds),
    onSelectRegion,
    onCommitSelection,
  });
  frameRef.current = {
    regions,
    routes,
    land,
    locale,
    selectedRegionId,
    projector,
    surface,
    reducedMotion,
    visibleRouteIds: new Set(visibleRouteIds),
    onSelectRegion,
    onCommitSelection,
  };

  const renderBase = useCallback(() => {
    const canvas = baseCanvasRef.current;
    const world = worldRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !world || !ctx) return;
    const {
      land: currentLand,
      projector: currentProjector,
      surface: currentSurface,
    } = frameRef.current;
    drawBaseLayer({
      ctx,
      world,
      land: currentLand,
      projector: currentProjector,
      view: viewRef.current,
      dpr: currentSurface.dpr,
    });
  }, []);

  const pulseRef = useRef(0);
  const dashRef = useRef(0);

  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const current = frameRef.current;
    drawOverlayLayer({
      ctx,
      regions: current.regions,
      routes: current.routes,
      visibleRouteIds: current.visibleRouteIds,
      projector: current.projector,
      view: viewRef.current,
      dpr: current.surface.dpr,
      locale: current.locale,
      selectedRegionId: current.selectedRegionId,
      pulse: pulseRef.current,
      dashOffset: dashRef.current,
      reducedMotion: current.reducedMotion,
    });
  }, []);

  const applyViewport = useCallback(
    (next: Viewport) => {
      viewRef.current = next;
      setZoom((previous) => (Math.abs(previous - next.k) < 0.001 ? previous : next.k));
      renderBase();
      renderOverlay();
    },
    [renderBase, renderOverlay],
  );

  // Rebuild the cached world whenever the canvas size or the dataset changes.
  useEffect(() => {
    if (surface.width === 0 || surface.height === 0) return;
    let cancelled = false;
    setIsBuilding(true);

    void buildWorldLayer({ regions, land, width: surface.width, height: surface.height })
      .then((world) => {
        if (cancelled) return;
        worldRef.current = world;
        applyViewport(clampViewport(viewRef.current, surface.width, surface.height));
        setIsBuilding(false);
      })
      .catch(() => {
        if (!cancelled) setIsBuilding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [regions, land, surface.width, surface.height, applyViewport]);

  // Redraw when something visual (selection, locale, routes) changes.
  useEffect(() => {
    renderBase();
    renderOverlay();
  }, [selectedRegionId, locale, visibleRouteIds, renderBase, renderOverlay]);

  // Animation loop: pulse ring + travelling dashes on the historic routes.
  useEffect(() => {
    if (reducedMotion) {
      renderOverlay();
      return;
    }
    let frame = 0;
    const tick = () => {
      pulseRef.current += PULSE_SPEED;
      dashRef.current += DASH_SPEED;
      renderOverlay();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, renderOverlay]);

  // Pointer, wheel and double-click handling on the overlay canvas.
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let pan: { x: number; y: number; tx: number; ty: number } | null = null;
    let pinch: {
      distance: number;
      k: number;
      mx: number;
      my: number;
      tx: number;
      ty: number;
    } | null = null;
    let moved = false;

    const toDevice = (event: PointerEvent | WheelEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { width, height } = frameRef.current.surface;
      return {
        x: ((event.clientX - rect.left) / rect.width) * width,
        y: ((event.clientY - rect.top) / rect.height) * height,
      };
    };

    const distanceBetween = (points: Array<{ x: number; y: number }>) => {
      const [a, b] = points;
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      const point = toDevice(event);
      pointers.set(event.pointerId, point);
      moved = false;

      if (pointers.size === 1) {
        pan = { x: point.x, y: point.y, tx: viewRef.current.tx, ty: viewRef.current.ty };
        pinch = null;
        setIsDragging(true);
      } else if (pointers.size === 2) {
        const points = [...pointers.values()];
        const [a, b] = points;
        if (!a || !b) return;
        pinch = {
          distance: distanceBetween(points),
          k: viewRef.current.k,
          mx: (a.x + b.x) / 2,
          my: (a.y + b.y) / 2,
          tx: viewRef.current.tx,
          ty: viewRef.current.ty,
        };
        pan = null;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = toDevice(event);
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, point);
      const { width, height } = frameRef.current.surface;

      if (pinch && pointers.size >= 2) {
        const points = [...pointers.values()];
        const [a, b] = points;
        if (!a || !b) return;
        const distance = distanceBetween(points);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const k = Math.min(9, Math.max(1, (pinch.k * distance) / pinch.distance));
        const factor = k / pinch.k;
        moved = true;
        applyViewport(
          clampViewport(
            { k, tx: mx - (pinch.mx - pinch.tx) * factor, ty: my - (pinch.my - pinch.ty) * factor },
            width,
            height,
          ),
        );
        return;
      }

      if (pan && pointers.size === 1 && pointers.has(event.pointerId)) {
        const dx = point.x - pan.x;
        const dy = point.y - pan.y;
        const threshold = DRAG_THRESHOLD_PX * frameRef.current.surface.dpr;
        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) moved = true;
        if (moved) {
          applyViewport(
            clampViewport({ ...viewRef.current, tx: pan.tx + dx, ty: pan.ty + dy }, width, height),
          );
        }
        return;
      }

      // Hovering with a mouse previews regions; touch requires an explicit tap.
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        const region = nearestRegion(
          frameRef.current.regions,
          frameRef.current.projector,
          viewRef.current,
          point.x,
          point.y,
        );
        if (region && region.id !== frameRef.current.selectedRegionId) {
          frameRef.current.onSelectRegion(region.id);
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const wasTap = !moved && pointers.size === 1 && pan !== null;
      pointers.delete(event.pointerId);

      if (pointers.size === 0) {
        setIsDragging(false);
        if (wasTap) {
          const point = toDevice(event);
          const region = nearestRegion(
            frameRef.current.regions,
            frameRef.current.projector,
            viewRef.current,
            point.x,
            point.y,
          );
          if (region) {
            frameRef.current.onSelectRegion(region.id);
            frameRef.current.onCommitSelection?.(region.id);
          }
        }
        pan = null;
        pinch = null;
      } else if (pointers.size === 1) {
        const [remaining] = [...pointers.values()];
        if (remaining) {
          pan = { x: remaining.x, y: remaining.y, tx: viewRef.current.tx, ty: viewRef.current.ty };
        }
        pinch = null;
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = toDevice(event);
      const { width, height } = frameRef.current.surface;
      applyViewport(
        zoomAt(
          viewRef.current,
          point.x,
          point.y,
          event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP,
          width,
          height,
        ),
      );
    };

    const onDoubleClick = (event: MouseEvent) => {
      const point = toDevice(event);
      const { width, height } = frameRef.current.surface;
      applyViewport(zoomAt(viewRef.current, point.x, point.y, DOUBLE_CLICK_STEP, width, height));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDoubleClick);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDoubleClick);
    };
  }, [applyViewport]);

  const zoomBy = useCallback(
    (factor: number) => {
      const { width, height } = frameRef.current.surface;
      applyViewport(zoomAt(viewRef.current, width / 2, height / 2, factor, width, height));
    },
    [applyViewport],
  );

  return {
    containerRef,
    baseCanvasRef,
    overlayCanvasRef,
    surface,
    zoom,
    isBuilding,
    isDragging,
    zoomIn: useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]),
    zoomOut: useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy]),
    resetView: useCallback(() => applyViewport({ ...IDENTITY_VIEWPORT }), [applyViewport]),
  };
}
