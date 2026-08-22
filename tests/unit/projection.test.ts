import { describe, expect, it } from 'vitest';
import {
  clampViewport,
  clampZoom,
  createProjector,
  zoomAt,
  ZOOM_MAX,
  ZOOM_MIN,
} from '@/features/atlas/lib/projection';

const projection = { lon0: -172, lon1: 181, lat0: -58, lat1: 79 };
const WIDTH = 1000;
const HEIGHT = 520;

describe('createProjector', () => {
  const projector = createProjector(projection, WIDTH, HEIGHT);

  it('maps the western edge to x = 0 and the eastern edge to the full width', () => {
    expect(projector.px(projection.lon0)).toBe(0);
    expect(projector.px(projection.lon1)).toBe(WIDTH);
  });

  it('maps the northern edge to y = 0 (canvas y grows downward)', () => {
    expect(projector.py(projection.lat1)).toBe(0);
    expect(projector.py(projection.lat0)).toBe(HEIGHT);
  });

  it('applies zoom and translation in screen space', () => {
    expect(projector.sx(100, { k: 2, tx: -50, ty: 0 })).toBe(150);
    expect(projector.sy(100, { k: 2, tx: 0, ty: -30 })).toBe(170);
  });
});

describe('clampZoom', () => {
  it('keeps zoom inside the supported range', () => {
    expect(clampZoom(0.2)).toBe(ZOOM_MIN);
    expect(clampZoom(50)).toBe(ZOOM_MAX);
    expect(clampZoom(3)).toBe(3);
  });
});

describe('clampViewport', () => {
  it('prevents panning past the map edges', () => {
    const clamped = clampViewport({ k: 2, tx: 500, ty: 500 }, WIDTH, HEIGHT);
    expect(clamped.tx).toBe(0);
    expect(clamped.ty).toBe(0);
  });

  it('prevents panning past the far edges', () => {
    const clamped = clampViewport({ k: 2, tx: -5000, ty: -5000 }, WIDTH, HEIGHT);
    expect(clamped.tx).toBe(WIDTH - WIDTH * 2);
    expect(clamped.ty).toBe(HEIGHT - HEIGHT * 2);
  });

  it('leaves no offset at all when fully zoomed out', () => {
    expect(clampViewport({ k: 1, tx: -300, ty: 40 }, WIDTH, HEIGHT)).toEqual({
      k: 1,
      tx: 0,
      ty: 0,
    });
  });
});

describe('zoomAt', () => {
  it('keeps the anchor point stationary while zooming in', () => {
    const view = { k: 2, tx: -200, ty: -100 };
    const anchorX = 400;
    const anchorY = 260;
    const worldBefore = (anchorX - view.tx) / view.k;

    const next = zoomAt(view, anchorX, anchorY, 1.5, WIDTH, HEIGHT);
    const worldAfter = (anchorX - next.tx) / next.k;

    expect(next.k).toBeCloseTo(3);
    expect(worldAfter).toBeCloseTo(worldBefore, 6);
  });

  it('never exceeds the zoom bounds', () => {
    expect(zoomAt({ k: 8, tx: 0, ty: 0 }, 0, 0, 4, WIDTH, HEIGHT).k).toBe(ZOOM_MAX);
    expect(zoomAt({ k: 1.1, tx: 0, ty: 0 }, 0, 0, 0.1, WIDTH, HEIGHT).k).toBe(ZOOM_MIN);
  });
});
