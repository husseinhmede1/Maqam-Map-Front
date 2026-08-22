import { useTranslation } from '@/shared/hooks/useTranslation';
import type { Region } from '@/types/atlas';
import styles from './RegionPanel.module.css';

interface RegionPanelProps {
  region: Region;
  neighbors: Region[];
  onSelectRegion: (regionId: string) => void;
}

/**
 * The "blends musically with" chips are the interactive form of the project's
 * core claim: you can walk from any tradition to its neighbours without ever
 * crossing a hard border.
 */
export function RegionPanel({ region, neighbors, onSelectRegion }: RegionPanelProps) {
  const { t, region: localize } = useTranslation();
  const localized = localize(region);

  return (
    <aside className={styles.panel} aria-live="polite">
      <div
        className={styles.accent}
        style={{ background: `linear-gradient(90deg, ${region.color}, transparent)` }}
      />
      <h2 className={styles.name} style={{ color: region.color }}>
        {localized.name}
      </h2>
      <div className={styles.system}>{localized.system}</div>
      <p className={styles.description}>{localized.description}</p>

      <div className={styles.label}>{t.panel.instruments}</div>
      <div className={styles.chips}>
        {localized.instruments.map((instrument) => (
          <span key={instrument} className={styles.chip}>
            {instrument}
          </span>
        ))}
      </div>

      <div className={styles.label}>{t.panel.blendsWith}</div>
      <div className={styles.chips}>
        {neighbors.map((neighbor) => (
          <button
            key={neighbor.id}
            type="button"
            className={`${styles.chip} ${styles.chipLink}`}
            style={{ borderColor: `${neighbor.color}66` }}
            onClick={() => onSelectRegion(neighbor.id)}
          >
            {localize(neighbor).name}
          </button>
        ))}
      </div>
    </aside>
  );
}
