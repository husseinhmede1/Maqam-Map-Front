import { create } from 'zustand';
import { resolvePlayback } from '@/shared/api/atlas.api';
import type { PlaybackResolution } from '@/types/atlas';

export type PlayerStatus = 'idle' | 'resolving' | 'preview' | 'video' | 'unavailable';

interface PlayerState {
  status: PlayerStatus;
  /** The song query currently loaded into the player, if any. */
  query: string | null;
  resolution: PlaybackResolution | null;
  youtubeSearchUrl: string | null;

  play: (query: string) => Promise<void>;
  close: () => void;
}

/**
 * A single global player: the bar is fixed to the viewport and the song list
 * needs to know which row is playing, so this state cannot live in a component.
 *
 * `token` guards against a slow lookup overwriting a newer one when the user
 * clicks through several songs quickly.
 */
let token = 0;

export const usePlayerStore = create<PlayerState>((set) => ({
  status: 'idle',
  query: null,
  resolution: null,
  youtubeSearchUrl: null,

  play: async (query) => {
    const current = ++token;
    set({
      status: 'resolving',
      query,
      resolution: null,
      youtubeSearchUrl: youtubeSearch(query),
    });

    try {
      const resolution = await resolvePlayback(query);
      if (current !== token) return;
      set({
        resolution,
        youtubeSearchUrl: resolution.youtubeSearchUrl,
        status: resolution.preview ? 'preview' : resolution.video ? 'video' : 'unavailable',
      });
    } catch {
      if (current !== token) return;
      set({ status: 'unavailable' });
    }
  },

  close: () => {
    token += 1;
    set({ status: 'idle', query: null, resolution: null, youtubeSearchUrl: null });
  },
}));

function youtubeSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
