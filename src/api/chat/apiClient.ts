// src/api/apiClient.ts

import { getTokens, saveTokens, clearTokens } from '../../store/tokenStorage';

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 동시에 여러 요청이 401을 맞아도 refresh는 한 번만 타도록 공유 Promise로 관리
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/token/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || payload?.success === false) {
          clearTokens();
          return null;
        }
        const { accessToken, refreshToken } = payload.data;
        // 기존에 로그인 유지(localStorage)였는지 여부를 그대로 유지해서 재저장
        const persist = tokens.storage === window.localStorage;
        saveTokens({ accessToken, refreshToken }, persist);
        return accessToken as string;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function parseResponse<T>(res: Response): Promise<T> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = await res.json();
  } catch {
    // 바디가 없는 응답(204 등)
  }

  if (!res.ok || (body && body.success === false)) {
    const message = body?.message ?? `요청에 실패했습니다. (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  return (body?.data as T) ?? (undefined as unknown as T);
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  isForm?: boolean;
  params?: Record<string, string | number | undefined>;
  // 토큰 재발급 재시도 후 다시 401이 나면 무한루프에 빠지지 않도록 내부에서만 사용
  _retried?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    isForm = false,
    params,
    _retried = false,
  } = options;

  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  const tokens = getTokens();
  const headers: Record<string, string> = {};
  if (tokens?.accessToken)
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  if (!isForm && body !== undefined)
    headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: isForm
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  if (res.status === 401 && !_retried && tokens?.refreshToken) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return request<T>(path, { ...options, _retried: true });
    }
    clearTokens();
    // TODO: 여기서 로그인 페이지로 리다이렉트할지는 라우팅 구조에 맞춰 상위에서 처리하는 게 나을 수도 있음
  }

  return parseResponse<T>(res);
}

export function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>(path, { method: 'GET', params });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body });
}

export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: 'POST', body: formData, isForm: true });
}
