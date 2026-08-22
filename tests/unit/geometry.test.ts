import { describe, expect, it } from 'vitest';
import { nearestRegion } from '@/features/atlas/lib/geometry';
import { createProjector, IDENTITY_VIEWPORT } from '@/features/atlas/lib/projection';
import type { Region } from '@/types/atlas';

const projection = { lon0: -172, lon1: 181, lat0: -58, lat1: 79 };
const projector = createProjector(projection, 1000, 520);

function region(id: string, lon: number, lat: number): Region {
  return {
    id,
    order: 0,
    color: '#FFFFFF',
    coordinates: { lon, lat },
    neighbors: [],
    translations: {
      ar: { name: id, system: '', instruments: [], description: '' },
      en: { name: id, system: '', instruments: [], description: '' },
    },
  };
}

describe('nearestRegion', () => {
  const regions = [region('cairo', 31, 30), region('tokyo', 139, 35), region('lima', -77, -12)];

  it('picks the region under the pointer', () => {
    const x = projector.px(31);
    const y = projector.py(30);
    expect(nearestRegion(regions, projector, IDENTITY_VIEWPORT, x, y)?.id).toBe('cairo');
  });

  it('accounts for the current viewport transform', () => {
    const view = { k: 3, tx: -500, ty: -200 };
    const x = projector.sx(projector.px(139), view);
    const y = projector.sy(projector.py(35), view);
    expect(nearestRegion(regions, projector, view, x, y)?.id).toBe('tokyo');
  });

  it('returns null when there are no regions to hit', () => {
    expect(nearestRegion([], projector, IDENTITY_VIEWPORT, 0, 0)).toBeNull();
  });
});
