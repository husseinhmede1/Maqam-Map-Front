import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/shared/store/app.store';
import type { HistoricRoute } from '@/types/atlas';

function route(id: string, defaultVisible: boolean): HistoricRoute {
  return {
    id,
    color: '#F0B65A',
    defaultVisible,
    paths: [
      [
        [0, 0],
        [1, 1],
      ],
    ],
    translations: {
      ar: { name: id, description: '' },
      en: { name: id, description: '' },
    },
  };
}

describe('app store', () => {
  beforeEach(() => {
    useAppStore.setState({ locale: 'ar', selectedRegionId: 'egypt', visibleRouteIds: [] });
  });

  it('toggles between the two locales', () => {
    useAppStore.getState().toggleLocale();
    expect(useAppStore.getState().locale).toBe('en');
    useAppStore.getState().toggleLocale();
    expect(useAppStore.getState().locale).toBe('ar');
  });

  it('seeds route visibility from the dataset defaults', () => {
    useAppStore.getState().initializeRoutes([route('silk', true), route('roma', false)]);
    expect(useAppStore.getState().visibleRouteIds).toEqual(['silk']);
  });

  it('does not overwrite a visitor choice on a later initialize', () => {
    useAppStore.getState().initializeRoutes([route('silk', true), route('roma', false)]);
    useAppStore.getState().toggleRoute('roma');
    useAppStore.getState().initializeRoutes([route('silk', true), route('roma', false)]);
    expect(useAppStore.getState().visibleRouteIds).toEqual(['silk', 'roma']);
  });

  it('toggles a route off again', () => {
    useAppStore.getState().initializeRoutes([route('silk', true)]);
    useAppStore.getState().toggleRoute('silk');
    expect(useAppStore.getState().visibleRouteIds).toEqual([]);
  });
});
