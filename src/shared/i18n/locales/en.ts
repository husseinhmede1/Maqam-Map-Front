import type { Dictionary } from '../dictionary';

export const en: Dictionary = {
  meta: { htmlLang: 'en', dir: 'ltr', numberLocale: 'en-US' },
  brand: 'MaqaMap',
  eyebrow: 'INTERACTIVE ATLAS · 99 MUSICAL REGIONS · 5 HISTORIC ROUTES · ZOOMABLE',
  tagline: 'Where the Maqams Blend',
  intro:
    'Music ignores political borders: the colors on this map blend gradually where musical styles blend — from the nuba of Fez to the maqam of Baghdad, from the dastgah of Shiraz to the muqam of Kashgar, from the ragas of Delhi to the pentatonic world of Beijing, and across the oceans to blues, son and samba. Scroll or pinch to zoom, drag to pan, and click any point to explore its music.',
  switchLanguage: 'عربي',

  map: {
    hint: 'Click a point to select it · drag to pan · scroll or pinch to zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    routesSummary: 'Historic transmission routes',
    zoomLabel: 'Zoom level',
  },

  panel: {
    instruments: 'Signature instruments',
    blendsWith: 'Blends musically with',
  },

  songs: {
    heading: 'Selected songs from {region}',
    note: 'Click any song to listen right here, or the YouTube badge to open it in a new tab',
    moreButton: 'More {genre} on YouTube →',
    empty: 'No song list for this region yet.',
  },

  player: {
    nowPlaying: 'Now playing',
    openYoutube: 'YouTube ↗',
    close: 'Close player',
    note: 'The server finds the recording and plays the best match. Some browsers block autoplay — press ▶ inside the player.',
    searching: '🔍 Finding the recording…',
    previewMode: '30-second preview · full song via YouTube ↗',
    failed:
      'No directly playable recording found — open the song on YouTube using the badge above.',
    copied: 'Could not open a new tab — we copied the link, paste it into the address bar',
    copyFailed: 'Could not open or copy the link — search for the song title on YouTube',
  },

  journey: {
    heading: 'The Maqam Journey: Ocean to Ocean',
    note: 'Exactly the path you described — each stop resembles its neighbor yet differs slightly, until everything has changed by road’s end.',
    stops: [
      'Fez',
      'Cairo',
      'Baghdad',
      'Istanbul',
      'Tehran',
      'Mashhad',
      'Bukhara',
      'Delhi',
      'Kashgar',
      'Beijing',
      'Kyoto',
    ],
  },

  status: {
    loading: 'Loading the atlas…',
    errorTitle: 'The map could not be loaded',
    errorBody: 'We could not reach the API. Make sure it is running, then try again.',
    retry: 'Try again',
  },

  footer:
    'Note: the map is simplified and approximate; each of the 99 regions contains dozens of local styles no single map can hold. Colors are a visual device for neighboring musical families and their gradients, not a strict scholarly classification.',
};
