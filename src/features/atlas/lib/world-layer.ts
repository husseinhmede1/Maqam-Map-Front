import type { LandGeometry, Region } from '@/types/atlas';
import { requestColorField } from './color-field-client';
import { createProjector } from './projection';
import { tracePolygon } from './geometry';

export interface WorldLayerInput {
  regions: Region[];
  land: LandGeometry;
  /** Canvas size in device pixels. */
  width: number;
  height: number;
}

export interface WorldLayer {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/** Cap on the cached layer's oversampling; above this the memory cost outweighs the sharpness. */
const MAX_SUPERSAMPLE = 2;
const MAX_LAYER_WIDTH = 3000;

/**
 * Composites the colour field into the shape of the continents and caches it as
 * an offscreen canvas.
 *
 * Panning and zooming redraw from this cache, so the expensive part — the field
 * and the land mask — happens only on resize. Coastlines are *not* baked in:
 * they are stroked as vectors each frame so they stay crisp at 9× zoom.
 */
export async function buildWorldLayer({
  regions,
  land,
  width,
  height,
}: WorldLayerInput): Promise<WorldLayer> {
  const supersample = Math.min(MAX_SUPERSAMPLE, MAX_LAYER_WIDTH / width);
  const layerWidth = Math.round(width * supersample);
  const layerHeight = Math.round(height * supersample);

  const field = await requestColorField({
    regions,
    projection: land.projection,
    canvasWidth: width,
    canvasHeight: height,
  });

  const fieldCanvas = document.createElement('canvas');
  fieldCanvas.width = field.width;
  fieldCanvas.height = field.height;
  const fieldCtx = fieldCanvas.getContext('2d');
  if (!fieldCtx) throw new Error('2D canvas context unavailable');
  fieldCtx.putImageData(new ImageData(field.pixels, field.width, field.height), 0, 0);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = layerWidth;
  maskCanvas.height = layerHeight;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('2D canvas context unavailable');
  const projector = createProjector(land.projection, width, height);
  maskCtx.fillStyle = '#fff';
  maskCtx.beginPath();
  for (const polygon of land.polygons) tracePolygon(maskCtx, polygon, projector, supersample);
  maskCtx.fill();

  const canvas = document.createElement('canvas');
  canvas.width = layerWidth;
  canvas.height = layerHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(fieldCanvas, 0, 0, layerWidth, layerHeight);
  // Everything outside the continents is discarded — the ocean stays empty.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);

  return { canvas, width: layerWidth, height: layerHeight };
}
