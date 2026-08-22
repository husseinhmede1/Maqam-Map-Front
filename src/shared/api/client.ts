export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiErrorEnvelope {
  error: { code: string; message: string; requestId?: string };
}

/**
 * In development `VITE_API_BASE_URL` is empty and requests go through the Vite
 * proxy, which keeps the browser same-origin.
 */
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const API_PREFIX = `${baseUrl}/api/v1`;

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: { accept: 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorEnvelope | null;
    throw new ApiError(
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.error?.code ?? 'UNKNOWN',
      payload?.error?.requestId,
    );
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}
