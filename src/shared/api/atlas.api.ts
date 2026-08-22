import type { AtlasBootstrap, PlaybackResolution } from '@/types/atlas';
import { apiGet } from './client';

export function fetchAtlas(signal?: AbortSignal): Promise<AtlasBootstrap> {
  return apiGet<AtlasBootstrap>('/atlas', { signal });
}

export function fetchRegionSongs(
  regionId: string,
  signal?: AbortSignal,
): Promise<{ regionId: string; queries: string[] }> {
  return apiGet(`/regions/${encodeURIComponent(regionId)}/songs`, { signal });
}

export function resolvePlayback(query: string, signal?: AbortSignal): Promise<PlaybackResolution> {
  return apiGet<PlaybackResolution>(`/playback/resolve?q=${encodeURIComponent(query)}`, { signal });
}
