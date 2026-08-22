import { create } from 'zustand';
import type { HistoricRoute, Locale } from '@/types/atlas';

interface AppState {
  locale: Locale;
  /** `null` only before the atlas has loaded. */
  selectedRegionId: string | null;
  visibleRouteIds: string[];

  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  selectRegion: (regionId: string) => void;
  toggleRoute: (routeId: string) => void;
  /** Seeds route visibility from the dataset's own defaults, once. */
  initializeRoutes: (routes: HistoricRoute[]) => void;
}

const DEFAULT_REGION = 'egypt';

export const useAppStore = create<AppState>((set, get) => ({
  locale: 'ar',
  selectedRegionId: DEFAULT_REGION,
  visibleRouteIds: [],

  setLocale: (locale) => set({ locale }),
  toggleLocale: () => set({ locale: get().locale === 'ar' ? 'en' : 'ar' }),
  selectRegion: (regionId) => set({ selectedRegionId: regionId }),

  toggleRoute: (routeId) =>
    set((state) => ({
      visibleRouteIds: state.visibleRouteIds.includes(routeId)
        ? state.visibleRouteIds.filter((id) => id !== routeId)
        : [...state.visibleRouteIds, routeId],
    })),

  initializeRoutes: (routes) => {
    if (get().visibleRouteIds.length > 0) return;
    set({
      visibleRouteIds: routes.filter((route) => route.defaultVisible).map((route) => route.id),
    });
  },
}));

export const selectLocale = (state: AppState): Locale => state.locale;
