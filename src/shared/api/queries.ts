import { useQuery } from '@tanstack/react-query';
import { fetchAtlas, fetchRegionSongs } from './atlas.api';

export const queryKeys = {
  atlas: ['atlas'] as const,
  regionSongs: (regionId: string) => ['regions', regionId, 'songs'] as const,
};

/**
 * One request feeds the whole map. The dataset is immutable between deploys, so
 * it never needs refetching within a session.
 */
export function useAtlas() {
  return useQuery({
    queryKey: queryKeys.atlas,
    queryFn: ({ signal }) => fetchAtlas(signal),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useRegionSongs(regionId: string | null) {
  return useQuery({
    queryKey: queryKeys.regionSongs(regionId ?? ''),
    queryFn: ({ signal }) => fetchRegionSongs(regionId as string, signal),
    enabled: Boolean(regionId),
    staleTime: Infinity,
  });
}
