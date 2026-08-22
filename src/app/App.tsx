import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AtlasMap } from '@/features/atlas/components/AtlasMap';
import { RegionPanel } from '@/features/region-panel/components/RegionPanel';
import { SongList } from '@/features/songs/components/SongList';
import { PlayerBar } from '@/features/player/components/PlayerBar';
import { JourneyStrip } from '@/features/journey/components/JourneyStrip';
import { useAtlas } from '@/shared/api/queries';
import { useAppStore } from '@/shared/store/app.store';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useDocumentLocale } from '@/shared/hooks/useDocumentLocale';
import { Toast } from '@/shared/ui/Toast';
import { AppHeader } from './AppHeader';
import styles from './App.module.css';

export function App() {
  const { t, locale } = useTranslation();
  useDocumentLocale(locale);

  const { data, isPending, isError, refetch } = useAtlas();
  const songsRef = useRef<HTMLDivElement | null>(null);

  const selectedRegionId = useAppStore((state) => state.selectedRegionId);
  const visibleRouteIds = useAppStore((state) => state.visibleRouteIds);
  const selectRegion = useAppStore((state) => state.selectRegion);
  const toggleRoute = useAppStore((state) => state.toggleRoute);
  const initializeRoutes = useAppStore((state) => state.initializeRoutes);

  useEffect(() => {
    if (data) initializeRoutes(data.routes);
  }, [data, initializeRoutes]);

  const regionsById = useMemo(
    () => new Map((data?.regions ?? []).map((region) => [region.id, region])),
    [data],
  );

  const selectedRegion = selectedRegionId ? regionsById.get(selectedRegionId) : undefined;
  const neighbors = useMemo(
    () =>
      (selectedRegion?.neighbors ?? [])
        .map((id) => regionsById.get(id))
        .filter((region) => region !== undefined),
    [selectedRegion, regionsById],
  );

  // A tap selects *and* brings the song list into view; hovering must not scroll.
  const onCommitSelection = useCallback(() => {
    songsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  if (isPending) {
    return (
      <div className={styles.shell}>
        <AppHeader />
        <div className={styles.status}>{t.status.loading}</div>
      </div>
    );
  }

  if (isError || !data || !selectedRegion) {
    return (
      <div className={styles.shell}>
        <AppHeader />
        <div className={styles.status}>
          <p className={styles.statusTitle}>{t.status.errorTitle}</p>
          <p>{t.status.errorBody}</p>
          <button type="button" className={styles.retry} onClick={() => void refetch()}>
            {t.status.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.shell}>
        <AppHeader />

        <div className={styles.layout}>
          <AtlasMap
            regions={data.regions}
            routes={data.routes}
            land={data.land}
            visibleRouteIds={visibleRouteIds}
            selectedRegionId={selectedRegion.id}
            onSelectRegion={selectRegion}
            onToggleRoute={toggleRoute}
            onCommitSelection={onCommitSelection}
          />
          <RegionPanel
            region={selectedRegion}
            neighbors={neighbors}
            onSelectRegion={selectRegion}
          />
        </div>

        <div ref={songsRef}>
          <SongList region={selectedRegion} />
        </div>

        <JourneyStrip />

        <footer className={styles.footer}>{t.footer}</footer>
      </div>

      <PlayerBar />
      <Toast />
    </>
  );
}
