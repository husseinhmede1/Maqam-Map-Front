import { useMemo } from 'react';
import { useAppStore } from '@/shared/store/app.store';
import { dictionaries, formatNumber, interpolate, type Dictionary } from '@/shared/i18n';
import type { Locale, Region, HistoricRoute } from '@/types/atlas';

export interface Translation {
  locale: Locale;
  t: Dictionary;
  /** Localized region fields — always use these instead of reading `translations` directly. */
  region: (region: Region) => Region['translations'][Locale];
  route: (route: HistoricRoute) => HistoricRoute['translations'][Locale];
  interpolate: (template: string, values: Record<string, string>) => string;
  number: (value: number) => string;
}

export function useTranslation(): Translation {
  const locale = useAppStore((state) => state.locale);

  return useMemo(
    () => ({
      locale,
      t: dictionaries[locale],
      region: (region: Region) => region.translations[locale],
      route: (route: HistoricRoute) => route.translations[locale],
      interpolate,
      number: (value: number) => formatNumber(value, locale),
    }),
    [locale],
  );
}
