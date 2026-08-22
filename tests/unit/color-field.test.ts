import { describe, expect, it } from 'vitest';
import { computeColorField, hexToRgb, FIELD_WIDTH } from '@/features/atlas/lib/color-field';

const projection = { lon0: -172, lon1: 181, lat0: -58, lat1: 79 };

function pixelAt(
  pixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): [number, number, number] {
  const index = (y * width + x) * 4;
  return [pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0];
}

describe('hexToRgb', () => {
  it('parses a six digit hex colour', () => {
    expect(hexToRgb('#F2CE6B')).toEqual([242, 206, 107]);
  });
});

describe('computeColorField', () => {
  const regions = [
    { color: '#FF0000', coordinates: { lon: -170, lat: 78 } },
    { color: '#0000FF', coordinates: { lon: 180, lat: -57 } },
  ];

  const field = computeColorField({
    regions,
    projection,
    canvasWidth: 1000,
    canvasHeight: 520,
  });

  it('produces a field matching the canvas aspect ratio', () => {
    expect(field.width).toBe(FIELD_WIDTH);
    expect(field.height).toBe(Math.round((FIELD_WIDTH * 520) / 1000));
    expect(field.pixels).toHaveLength(field.width * field.height * 4);
  });

  it('is fully opaque everywhere — the land mask, not alpha, cuts out the oceans', () => {
    for (let index = 3; index < field.pixels.length; index += 4) {
      expect(field.pixels[index]).toBe(255);
    }
  });

  it('reproduces a region colour almost exactly at that region', () => {
    const [r, g, b] = pixelAt(field.pixels, field.width, 0, 0);
    expect(r).toBeGreaterThan(240);
    expect(g).toBeLessThan(15);
    expect(b).toBeLessThan(15);
  });

  it('blends between neighbours rather than drawing a hard border', () => {
    const midX = Math.floor(field.width / 2);
    const midY = Math.floor(field.height / 2);
    const [r, , b] = pixelAt(field.pixels, field.width, midX, midY);
    expect(r).toBeGreaterThan(20);
    expect(b).toBeGreaterThan(20);
  });

  it('varies smoothly: adjacent pixels never jump by a large step', () => {
    const y = Math.floor(field.height / 2);
    let maxJump = 0;
    for (let x = 1; x < field.width; x += 1) {
      const [r0] = pixelAt(field.pixels, field.width, x - 1, y);
      const [r1] = pixelAt(field.pixels, field.width, x, y);
      maxJump = Math.max(maxJump, Math.abs(r1 - r0));
    }
    expect(maxJump).toBeLessThan(20);
  });
});
