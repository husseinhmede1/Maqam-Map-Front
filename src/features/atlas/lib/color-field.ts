import type { Projection, Region } from '@/types/atlas';

/** Width of the interpolated field, in pixels. Upscaled smoothly when drawn. */
export const FIELD_WIDTH = 340;

/** Inverse-distance weighting power. Higher = tighter regions, less blending. */
const IDW_POWER_TERM = 1.5;

export interface ColorFieldInput {
  regions: Array<Pick<Region, 'color' | 'coordinates'>>;
  projection: Projection;
  /** Aspect ratio source — the field matches the canvas, not the screen. */
  canvasWidth: number;
  canvasHeight: number;
}

export interface ColorField {
  width: number;
  height: number;
  /**
   * RGBA bytes, backed by a plain (transferable) ArrayBuffer so the worker can
   * hand it over without copying and `ImageData` accepts it directly.
   */
  pixels: Uint8ClampedArray<ArrayBuffer>;
}

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * The visual heart of the project: every pixel is an inverse-distance weighted
 * average of all 108 region colours, so styles blend continuously instead of
 * sitting in hard-edged blocks (CLAUDE.md §1).
 *
 * Cost is `width × height × regions` — about 6.5M weighted samples at the
 * default size, which is why it runs in a worker and its result is cached.
 */
export function computeColorField({
  regions,
  projection,
  canvasWidth,
  canvasHeight,
}: ColorFieldInput): ColorField {
  const width = FIELD_WIDTH;
  const height = Math.max(1, Math.round((FIELD_WIDTH * canvasHeight) / canvasWidth));
  const { lon0, lon1, lat0, lat1 } = projection;
  const lonSpan = lon1 - lon0;
  const latSpan = lat1 - lat0;

  const nodes = regions.map((region) => {
    const [r, g, b] = hexToRgb(region.color);
    return {
      x: ((region.coordinates.lon - lon0) / lonSpan) * width,
      y: ((lat1 - region.coordinates.lat) / latSpan) * height,
      r,
      g,
      b,
    };
  });

  const pixels = new Uint8ClampedArray(new ArrayBuffer(width * height * 4));
  let cursor = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumW = 0;

      for (const node of nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        const d2 = dx * dx + dy * dy;
        // d^3, plus a floor so a pixel sitting exactly on a node stays finite.
        const weight = 1 / (d2 * Math.sqrt(d2) + IDW_POWER_TERM);
        sumR += node.r * weight;
        sumG += node.g * weight;
        sumB += node.b * weight;
        sumW += weight;
      }

      pixels[cursor] = sumR / sumW;
      pixels[cursor + 1] = sumG / sumW;
      pixels[cursor + 2] = sumB / sumW;
      pixels[cursor + 3] = 255;
      cursor += 4;
    }
  }

  return { width, height, pixels };
}
