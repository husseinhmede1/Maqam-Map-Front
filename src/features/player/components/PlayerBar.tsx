import { useEffect, useRef } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useExternalLink } from '@/shared/hooks/useExternalLink';
import { usePlayerStore } from '../player.store';
import styles from './PlayerBar.module.css';

/**
 * One player for the whole app. It shows whichever medium the API managed to
 * resolve — an audio preview, an embedded video, or neither — and always keeps
 * the YouTube escape hatch visible.
 */
export function PlayerBar() {
  const { t } = useTranslation();
  const openExternal = useExternalLink();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const status = usePlayerStore((state) => state.status);
  const query = usePlayerStore((state) => state.query);
  const resolution = usePlayerStore((state) => state.resolution);
  const youtubeSearchUrl = usePlayerStore((state) => state.youtubeSearchUrl);
  const close = usePlayerStore((state) => state.close);

  // Escape closes the player, matching the behaviour of every media overlay.
  useEffect(() => {
    if (status === 'idle') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [status, close]);

  // Autoplay is best-effort: a browser refusing it is normal, not an error.
  useEffect(() => {
    if (status !== 'preview') return;
    audioRef.current?.play().catch(() => undefined);
  }, [status, resolution]);

  useEffect(() => {
    document.body.style.paddingBottom = status === 'idle' ? '' : '250px';
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [status]);

  if (status === 'idle' || !query) return null;

  return (
    <div className={styles.player}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.now}>
            {t.player.nowPlaying}
            {status === 'preview' ? ` · ${t.player.previewMode}` : ''}
          </span>
          <span className={styles.title}>{query}</span>
          {youtubeSearchUrl && (
            <a
              className={styles.youtube}
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => openExternal(youtubeSearchUrl, event)}
            >
              {t.player.openYoutube}
            </a>
          )}
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label={t.player.close}
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {status === 'resolving' && <div className={styles.status}>{t.player.searching}</div>}
          {status === 'unavailable' && <div className={styles.status}>{t.player.failed}</div>}

          {status === 'preview' && resolution?.preview && (
            <audio
              ref={audioRef}
              className={styles.audio}
              src={resolution.preview.url}
              controls
              preload="auto"
            />
          )}

          {status === 'video' && resolution?.video && (
            <iframe
              className={styles.frame}
              src={`${resolution.video.embedUrl}&autoplay=1`}
              title={resolution.video.title ?? query}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )}

          <div className={styles.note}>{t.player.note}</div>
        </div>
      </div>
    </div>
  );
}
