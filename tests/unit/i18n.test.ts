import { describe, expect, it } from 'vitest';
import { dictionaries, interpolate, formatNumber } from '@/shared/i18n';

/** Guards CLAUDE.md §7.2: nothing ships in one language only. */
function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return [`${prefix}[]`];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      keyPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

describe('dictionaries', () => {
  it('define exactly the same keys in Arabic and English', () => {
    expect(keyPaths(dictionaries.ar).sort()).toEqual(keyPaths(dictionaries.en).sort());
  });

  it('leave no empty strings', () => {
    for (const [locale, dictionary] of Object.entries(dictionaries)) {
      const empties = JSON.stringify(dictionary).match(/:\s*""/g) ?? [];
      expect(empties, `${locale} has empty strings`).toHaveLength(0);
    }
  });

  it('list the same journey stops in both languages', () => {
    expect(dictionaries.ar.journey.stops).toHaveLength(dictionaries.en.journey.stops.length);
  });

  it('keep matching placeholders across languages', () => {
    expect(dictionaries.ar.songs.heading).toContain('{region}');
    expect(dictionaries.en.songs.heading).toContain('{region}');
    expect(dictionaries.ar.songs.moreButton).toContain('{genre}');
    expect(dictionaries.en.songs.moreButton).toContain('{genre}');
  });
});

describe('interpolate', () => {
  it('replaces placeholders and leaves unknown ones untouched', () => {
    expect(interpolate('Songs from {region}', { region: 'Iraq' })).toBe('Songs from Iraq');
    expect(interpolate('Songs from {region}', {})).toBe('Songs from {region}');
  });
});

describe('formatNumber', () => {
  it('uses Eastern Arabic numerals in Arabic', () => {
    expect(formatNumber(3, 'ar')).toBe('٣');
    expect(formatNumber(3, 'en')).toBe('3');
  });
});
