import { useTranslation } from '@/shared/hooks/useTranslation';
import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomIn}
        title={t.map.zoomIn}
        aria-label={t.map.zoomIn}
      >
        ＋
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomOut}
        title={t.map.zoomOut}
        aria-label={t.map.zoomOut}
      >
        －
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onReset}
        title={t.map.resetView}
        aria-label={t.map.resetView}
      >
        ⌖
      </button>
    </div>
  );
}
