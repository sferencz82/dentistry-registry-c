import fetch from 'cross-fetch';
import { useMemo } from 'react';
import { loadMobileEnv } from '../env';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  data?: T;
  ok: boolean;
  status: number;
  error?: string;
};

const buildUrl = (baseUrl: string, path: string) => {
  if (path.startsWith('http')) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const createApiClient = (baseUrl: string, defaultHeaders: Record<string, string> = {}) => {
  const request = async <T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    const { method = 'GET', body, headers } = options;
    const url = buildUrl(baseUrl, path);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? ((await response.json()) as T) : undefined;

      return {
        data,
        ok: response.ok,
        status: response.status,
        error: response.ok ? undefined : response.statusText
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
  };
};

export const useApiClient = () => {
  const env = useMemo(loadMobileEnv, []);

  return useMemo(() => createApiClient(env.apiUrl), [env.apiUrl]);
};
