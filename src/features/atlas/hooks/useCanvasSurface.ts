import { useMemo, type RefObject } from 'react';
import { useElementSize } from '@/shared/hooks/useElementSize';

/** The map's fixed aspect ratio: wide enough to hold the whole world comfortably. */
export const MAP_ASPECT_RATIO = 0.52;
const MIN_CSS_WIDTH = 320;
const MAX_DPR = 2;

export interface CanvasSurface {
  /** CSS pixels. */
  cssWidth: number;
  cssHeight: number;
  /** Device pixels — what the canvas backing store actually uses. */
  width: number;
  height: number;
  dpr: number;
}

/**
 * Derives canvas dimensions from the container's measured width. Capping the
 * device pixel ratio at 2 keeps the colour field affordable on phones that
 * report 3x or 4x.
 */
export function useCanvasSurface(containerRef: RefObject<HTMLElement | null>): CanvasSurface {
  const { width: measuredWidth } = useElementSize(containerRef);

  return useMemo(() => {
    const cssWidth = Math.max(MIN_CSS_WIDTH, Math.round(measuredWidth));
    const cssHeight = Math.round(cssWidth * MAP_ASPECT_RATIO);
    const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, MAX_DPR);
    return {
      cssWidth,
      cssHeight,
      dpr,
      width: Math.round(cssWidth * dpr),
      height: Math.round(cssHeight * dpr),
    };
  }, [measuredWidth]);
}
