import { useTranslation } from '@/shared/hooks/useTranslation';
import { useAppStore } from '@/shared/store/app.store';
import styles from './App.module.css';

export function AppHeader() {
  const { t } = useTranslation();
  const toggleLocale = useAppStore((state) => state.toggleLocale);

  return (
    <header className={styles.header}>
      <div className={styles.topline}>
        <div className={styles.eyebrow}>{t.eyebrow}</div>
        <button type="button" className={styles.langButton} onClick={toggleLocale}>
          {t.switchLanguage}
        </button>
      </div>
      <h1 className={styles.brand}>{t.brand}</h1>
      <p className={styles.tagline}>{t.tagline}</p>
      <p className={styles.intro}>{t.intro}</p>
    </header>
  );
}
