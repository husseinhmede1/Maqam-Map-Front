/** Canvas colours. The DOM equivalents live in `src/shared/styles/tokens.css`. */
export const canvasTheme = {
  ocean: '#0A0812',
  coastline: 'rgba(237,231,218,0.17)',
  labelHalo: 'rgba(10,8,18,0.85)',
  labelFill: 'rgba(237,231,218,0.92)',
  markerRing: '#0D0A16',
  markerCore: '#F5EFE2',
  calloutFill: 'rgba(10,8,18,0.87)',
  calloutStroke: 'rgba(237,231,218,0.3)',
  calloutText: '#EDE7DA',
  fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
} as const;

/** Zoom thresholds at which extra detail appears. */
export const detailThresholds = {
  routeLabels: 1.6,
  regionLabels: 2.3,
} as const;
