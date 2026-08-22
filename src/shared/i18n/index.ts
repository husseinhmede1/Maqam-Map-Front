import type { Locale } from '@/types/atlas';
import type { Dictionary } from './dictionary';
import { ar } from './locales/ar';
import { en } from './locales/en';

export const dictionaries: Record<Locale, Dictionary> = { ar, en };

export type { Dictionary };

/** Fills `{placeholders}` in a translated string. */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function formatNumber(value: number, locale: Locale): string {
  return value.toLocaleString(dictionaries[locale].meta.numberLocale);
}
