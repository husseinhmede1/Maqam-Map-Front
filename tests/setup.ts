import '@testing-library/jest-dom/vitest';

// jsdom implements neither ResizeObserver nor the canvas 2D context; components
// under test only need them to exist, the drawing itself is tested as pure code.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
