/**
 * Mirrors the API contract of `maqamap-api`. Kept hand-written and small rather
 * than generated: the surface is stable and this file doubles as documentation.
 */

export type Locale = 'ar' | 'en';

export interface Coordinates {
  lon: number;
  lat: number;
}

export interface RegionTranslation {
  name: string;
  system: string;
  instruments: string[];
  description: string;
}

export interface Region {
  id: string;
  order: number;
  /** Seeds the interpolated color field — see CLAUDE.md §7.1 before changing. */
  color: string;
  coordinates: Coordinates;
  neighbors: string[];
  translations: Record<Locale, RegionTranslation>;
}

export interface HistoricRouteTranslation {
  name: string;
  description: string;
}

export type LonLat = [number, number];

export interface HistoricRoute {
  id: string;
  color: string;
  defaultVisible: boolean;
  paths: LonLat[][];
  translations: Record<Locale, HistoricRouteTranslation>;
}

export interface Projection {
  lon0: number;
  lon1: number;
  lat0: number;
  lat1: number;
}

export interface LandGeometry {
  projection: Projection;
  polygons: LonLat[][];
}

export interface AtlasMeta {
  regionCount: number;
  routeCount: number;
  polygonCount: number;
  songsPerRegion: number;
  locales: Locale[];
  projection: Projection;
}

export interface AtlasBootstrap {
  meta: AtlasMeta;
  regions: Region[];
  routes: HistoricRoute[];
  land: LandGeometry;
}

export interface TrackPreview {
  provider: 'itunes';
  url: string;
  trackName: string;
  artistName: string;
  artworkUrl: string | null;
  durationMs: number | null;
}

export interface VideoMatch {
  provider: 'piped' | 'invidious';
  videoId: string;
  embedUrl: string;
  title: string | null;
}

export interface PlaybackResolution {
  query: string;
  preview: TrackPreview | null;
  video: VideoMatch | null;
  youtubeSearchUrl: string;
  resolvedAt: string;
}
