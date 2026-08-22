import { computeColorField, type ColorField, type ColorFieldInput } from '../lib/color-field';

/**
 * Keeps the ~6M-sample colour field off the main thread, so resizing the window
 * never drops frames. The result is transferred, not copied.
 */
self.onmessage = (event: MessageEvent<ColorFieldInput & { requestId: number }>) => {
  const { requestId, ...input } = event.data;
  const field: ColorField = computeColorField(input);
  const message = { requestId, ...field };
  (self as unknown as Worker).postMessage(message, [field.pixels.buffer]);
};
