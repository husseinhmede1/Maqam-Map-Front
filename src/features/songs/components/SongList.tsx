import { useTranslation } from '@/shared/hooks/useTranslation';
import { useExternalLink } from '@/shared/hooks/useExternalLink';
import { useRegionSongs } from '@/shared/api/queries';
import { usePlayerStore } from '@/features/player/player.store';
import type { Region } from '@/types/atlas';
import styles from './SongList.module.css';

interface SongListProps {
  region: Region;
}

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Song lists are stored as *search phrases*, not video ids: ids rot as uploads
 * are deleted or geo-blocked, while "artist — title" stays valid forever
 * (CLAUDE.md §7.3). Resolution into something playable happens server-side.
 */
export function SongList({ region }: SongListProps) {
  const { t, locale, region: localize, interpolate, number } = useTranslation();
  const { data, isPending } = useRegionSongs(region.id);
  const openExternal = useExternalLink();

  const play = usePlayerStore((state) => state.play);
  const nowPlaying = usePlayerStore((state) => state.query);

  const localized = localize(region);
  const queries = data?.queries ?? [];
  const moreQuery = `${localized.system} ${localized.name} ${locale === 'ar' ? 'موسيقى' : 'music'}`;

  return (
    <section className={styles.songs} aria-live="polite">
      <h3 className={styles.heading} style={{ color: region.color }}>
        {interpolate(t.songs.heading, { region: localized.name })}
      </h3>
      <div className={styles.note}>{t.songs.note}</div>

      <ol className={styles.list}>
        {isPending
          ? Array.from({ length: 10 }, (_, index) => (
              <li key={index}>
                <div className={styles.skeleton} />
              </li>
            ))
          : queries.map((query, index) => {
              const isPlaying = query === nowPlaying;
              return (
                <li key={query}>
                  <div
                    className={`${styles.row} ${isPlaying ? styles.playing : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void play(query)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void play(query);
                      }
                    }}
                  >
                    <span className={styles.playButton} aria-hidden="true">
                      {isPlaying ? '❚❚' : '◀'}
                    </span>
                    <span className={styles.index}>{number(index + 1)}</span>
                    <span className={styles.title}>{query}</span>
                    <a
                      className={styles.youtube}
                      href={youtubeSearchUrl(query)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.stopPropagation();
                        openExternal(youtubeSearchUrl(query), event);
                      }}
                    >
                      YouTube ↗
                    </a>
                  </div>
                </li>
              );
            })}
      </ol>

      {!isPending && queries.length === 0 && <p className={styles.note}>{t.songs.empty}</p>}

      <a
        className={styles.more}
        style={{ borderColor: region.color, color: region.color }}
        href={youtubeSearchUrl(moreQuery)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => openExternal(youtubeSearchUrl(moreQuery), event)}
      >
        {interpolate(t.songs.moreButton, { genre: localized.system })}
      </a>
    </section>
  );
}
