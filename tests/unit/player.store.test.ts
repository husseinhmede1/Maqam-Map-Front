import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerStore } from '@/features/player/player.store';
import * as api from '@/shared/api/atlas.api';
import type { PlaybackResolution } from '@/types/atlas';

function resolution(overrides: Partial<PlaybackResolution> = {}): PlaybackResolution {
  return {
    query: 'test',
    preview: null,
    video: null,
    youtubeSearchUrl: 'https://www.youtube.com/results?search_query=test',
    resolvedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('player store', () => {
  beforeEach(() => {
    usePlayerStore.getState().close();
    vi.restoreAllMocks();
  });

  it('enters preview mode when the API returns an audio preview', async () => {
    vi.spyOn(api, 'resolvePlayback').mockResolvedValue(
      resolution({
        preview: {
          provider: 'itunes',
          url: 'https://example.test/a.m4a',
          trackName: 'x',
          artistName: 'y',
          artworkUrl: null,
          durationMs: 30000,
        },
      }),
    );

    await usePlayerStore.getState().play('أم كلثوم — ألف ليلة وليلة');
    expect(usePlayerStore.getState().status).toBe('preview');
  });

  it('falls back to video mode, then to unavailable', async () => {
    vi.spyOn(api, 'resolvePlayback').mockResolvedValue(
      resolution({
        video: {
          provider: 'piped',
          videoId: 'abcdefghijk',
          embedUrl: 'https://example.test/embed',
          title: null,
        },
      }),
    );
    await usePlayerStore.getState().play('a');
    expect(usePlayerStore.getState().status).toBe('video');

    vi.spyOn(api, 'resolvePlayback').mockResolvedValue(resolution());
    await usePlayerStore.getState().play('b');
    expect(usePlayerStore.getState().status).toBe('unavailable');
  });

  it('marks playback unavailable when the request fails, keeping a YouTube link', async () => {
    vi.spyOn(api, 'resolvePlayback').mockRejectedValue(new Error('offline'));
    await usePlayerStore.getState().play('فيروز — يا طير');
    expect(usePlayerStore.getState().status).toBe('unavailable');
    expect(usePlayerStore.getState().youtubeSearchUrl).toContain('youtube.com/results');
  });

  it('ignores a slow response once a newer song has been requested', async () => {
    const slow = resolution({
      query: 'first',
      video: {
        provider: 'piped',
        videoId: 'aaaaaaaaaaa',
        embedUrl: 'https://example.test/first',
        title: null,
      },
    });
    const fast = resolution({ query: 'second' });

    vi.spyOn(api, 'resolvePlayback').mockImplementation((query: string) =>
      query === 'first'
        ? new Promise((resolve) => setTimeout(() => resolve(slow), 30))
        : Promise.resolve(fast),
    );

    const firstCall = usePlayerStore.getState().play('first');
    await usePlayerStore.getState().play('second');
    await firstCall;

    expect(usePlayerStore.getState().query).toBe('second');
    expect(usePlayerStore.getState().status).toBe('unavailable');
  });

  it('clears everything on close', async () => {
    vi.spyOn(api, 'resolvePlayback').mockResolvedValue(resolution());
    await usePlayerStore.getState().play('x');
    usePlayerStore.getState().close();
    expect(usePlayerStore.getState()).toMatchObject({ status: 'idle', query: null });
  });
});
