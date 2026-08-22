import { computeColorField, type ColorField, type ColorFieldInput } from './color-field';

type PendingResolver = (field: ColorField) => void;

let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, PendingResolver>();

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') return null;

  try {
    worker = new Worker(new URL('../workers/color-field.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<ColorField & { requestId: number }>) => {
      const { requestId, width, height, pixels } = event.data;
      pending.get(requestId)?.({ width, height, pixels });
      pending.delete(requestId);
    };
    worker.onerror = () => {
      // Fall back to the main thread for the rest of the session.
      worker?.terminate();
      worker = null;
      for (const resolve of pending.values()) resolve(computeColorFieldSync());
      pending.clear();
    };
    return worker;
  } catch {
    return null;
  }
}

let lastInput: ColorFieldInput | null = null;
function computeColorFieldSync(): ColorField {
  if (!lastInput) throw new Error('No colour field input recorded');
  return computeColorField(lastInput);
}

/**
 * Computes the colour field in a worker when one is available, and synchronously
 * otherwise (jsdom in tests, or a browser that refuses to spawn the worker).
 */
export async function requestColorField(input: ColorFieldInput): Promise<ColorField> {
  lastInput = input;
  const activeWorker = getWorker();
  if (!activeWorker) return computeColorField(input);

  const requestId = nextRequestId++;
  return new Promise<ColorField>((resolve) => {
    pending.set(requestId, resolve);
    activeWorker.postMessage({ requestId, ...input });
  });
}
