import { fetch } from 'expo/fetch';

import { env } from '@/config/env';

type TokenProvider = () => string | null | Promise<string | null>;
type TokenRefresher = () => string | null | Promise<string | null>;

export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data?: T,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
  authenticated?: boolean;
};

let getAccessToken: TokenProvider = () => null;
let refreshAccessToken: TokenRefresher | null = null;
let activeRefresh: Promise<string | null> | null = null;

export function configureApiClient(options: {
  getAccessToken?: TokenProvider;
  refreshAccessToken?: TokenRefresher;
}) {
  getAccessToken = options.getAccessToken ?? (() => null);
  refreshAccessToken = options.refreshAccessToken ?? null;
}

function toUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${env.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, options, false);
}

async function request<T>(
  path: string,
  options: ApiRequestOptions,
  retriedAfterRefresh: boolean,
): Promise<T> {
  const {
    authenticated = true,
    body,
    headers,
    timeoutMs = 15_000,
    ...requestOptions
  } = options;
  const token = authenticated ? await getAccessToken() : null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(toUrl(path), {
      ...requestOptions,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    if (
      response.status === 401 &&
      authenticated &&
      !retriedAfterRefresh &&
      refreshAccessToken
    ) {
      activeRefresh ??= Promise.resolve(refreshAccessToken()).finally(() => {
        activeRefresh = null;
      });
      const refreshedToken = await activeRefresh;
      if (refreshedToken) return request<T>(path, options, true);
    }

    if (!response.ok) {
      throw new ApiError(
        typeof data === 'object' && data && 'message' in data
          ? String(data.message)
          : 'Não foi possível concluir a solicitação.',
        response.status,
        data,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('A solicitação demorou mais que o esperado.', 408);
    }
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
