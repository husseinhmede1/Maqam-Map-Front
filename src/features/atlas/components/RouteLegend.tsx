import { useTranslation } from '@/shared/hooks/useTranslation';
import type { HistoricRoute } from '@/types/atlas';
import styles from './RouteLegend.module.css';

interface RouteLegendProps {
  routes: HistoricRoute[];
  visibleRouteIds: string[];
  onToggle: (routeId: string) => void;
  /** Collapsed by default on narrow screens, where it would cover the map. */
  defaultOpen?: boolean;
}

export function RouteLegend({
  routes,
  visibleRouteIds,
  onToggle,
  defaultOpen = true,
}: RouteLegendProps) {
  const { t, route: localizeRoute } = useTranslation();

  return (
    <details className={styles.legend} open={defaultOpen}>
      <summary className={styles.summary}>{t.map.routesSummary} ▾</summary>
      {routes.map((route) => {
        const localized = localizeRoute(route);
        return (
          <label key={route.id} className={styles.option} title={localized.description}>
            <input
              type="checkbox"
              checked={visibleRouteIds.includes(route.id)}
              onChange={() => onToggle(route.id)}
            />
            <span className={styles.swatch} style={{ background: route.color }} />
            <span>{localized.name}</span>
          </label>
        );
      })}
    </details>
  );
}
