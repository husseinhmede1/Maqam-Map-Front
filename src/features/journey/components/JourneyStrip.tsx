import { useTranslation } from '@/shared/hooks/useTranslation';
import styles from './JourneyStrip.module.css';

/**
 * The project's thesis in one strip: Fez to Kyoto without a single hard edge —
 * the exact route the project owner described when the idea started.
 */
export function JourneyStrip() {
  const { t } = useTranslation();

  return (
    <section className={styles.journey}>
      <h3 className={styles.heading}>{t.journey.heading}</h3>
      <div className={styles.note}>{t.journey.note}</div>
      <div className={styles.strip} />
      <div className={styles.stops}>
        {t.journey.stops.map((stop) => (
          <span key={stop}>{stop}</span>
        ))}
      </div>
    </section>
  );
}
