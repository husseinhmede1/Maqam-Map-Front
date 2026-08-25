import { useTranslation } from '@/shared/hooks/useTranslation';
import type { HistoricRoute, LandGeometry, Region } from '@/types/atlas';
import { useAtlasMap } from '../hooks/useAtlasMap';
import { RouteLegend } from './RouteLegend';
import { ZoomControls } from './ZoomControls';
import styles from './AtlasMap.module.css';

interface AtlasMapProps {
  regions: Region[];
  routes: HistoricRoute[];
  land: LandGeometry;
  visibleRouteIds: string[];
  selectedRegionId: string | null;
  /** Fired when the visitor clicks or taps a point on the map. */
  onSelectRegion: (regionId: string) => void;
  onToggleRoute: (routeId: string) => void;
}

const NARROW_SCREEN = 700;

/**
 * Two stacked canvases: a static base (land + coastlines, redrawn on view
 * changes) and an animated overlay (markers, routes, labels). Splitting them is
 * what keeps the pulse animation from re-rasterising the whole world each frame.
 */
export function AtlasMap({
  regions,
  routes,
  land,
  visibleRouteIds,
  selectedRegionId,
  onSelectRegion,
  onToggleRoute,
}: AtlasMapProps) {
  const { t, locale, number } = useTranslation();
  const map = useAtlasMap({
    regions,
    routes,
    land,
    visibleRouteIds,
    selectedRegionId,
    locale,
    onSelectRegion,
  });

  const zoomLabel = map.zoom >= 2 ? Math.round(map.zoom) : Math.round(map.zoom * 10) / 10;

  return (
    <div className={styles.mapbox} ref={map.containerRef}>
      <canvas
        ref={map.baseCanvasRef}
        className={styles.canvas}
        width={map.surface.width}
        height={map.surface.height}
        style={{ height: `${map.surface.cssHeight}px` }}
        aria-hidden="true"
      />
      <canvas
        ref={map.overlayCanvasRef}
        className={`${styles.overlay} ${map.isDragging ? styles.overlayDragging : ''}`}
        width={map.surface.width}
        height={map.surface.height}
        role="application"
        aria-label={t.tagline}
      />
      <div className={styles.vignette} />

      <ZoomControls onZoomIn={map.zoomIn} onZoomOut={map.zoomOut} onReset={map.resetView} />

      <div className={styles.zoomBadge} aria-label={t.map.zoomLabel}>
        ×{number(zoomLabel)}
      </div>

      <RouteLegend
        routes={routes}
        visibleRouteIds={visibleRouteIds}
        onToggle={onToggleRoute}
        defaultOpen={typeof window === 'undefined' || window.innerWidth >= NARROW_SCREEN}
      />

      <div className={styles.hint}>{t.map.hint}</div>

      {map.isBuilding && <div className={styles.building}>{t.status.loading}</div>}
    </div>
  );
}
