import { useEffect } from 'react';
import { dictionaries } from '@/shared/i18n';
import type { Locale } from '@/types/atlas';

/** Keeps `<html lang>` / `<html dir>` and the document title in sync with the UI locale. */
export function useDocumentLocale(locale: Locale): void {
  useEffect(() => {
    const dictionary = dictionaries[locale];
    document.documentElement.lang = dictionary.meta.htmlLang;
    document.documentElement.dir = dictionary.meta.dir;
    document.title = `${dictionary.brand} — ${dictionary.tagline}`;
  }, [locale]);
}
