/**
 * The shape every locale must satisfy. Adding a key here is a compile error in
 * any locale that has not been translated yet — which is exactly the guard the
 * old single-file version lacked (CLAUDE.md §7.2).
 */
export interface Dictionary {
  meta: { htmlLang: string; dir: 'rtl' | 'ltr'; numberLocale: string };
  brand: string;
  eyebrow: string;
  tagline: string;
  intro: string;
  switchLanguage: string;

  map: {
    hint: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    routesSummary: string;
    zoomLabel: string;
  };

  panel: {
    instruments: string;
    blendsWith: string;
  };

  songs: {
    /** `{region}` is replaced with the localized region name. */
    heading: string;
    note: string;
    /** `{genre}` is replaced with the localized musical system. */
    moreButton: string;
    empty: string;
  };

  player: {
    nowPlaying: string;
    openYoutube: string;
    close: string;
    note: string;
    searching: string;
    previewMode: string;
    failed: string;
    copied: string;
    copyFailed: string;
  };

  journey: {
    heading: string;
    note: string;
    stops: string[];
  };

  status: {
    loading: string;
    errorTitle: string;
    errorBody: string;
    retry: string;
  };

  footer: string;
}
