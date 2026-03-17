/**
 * API クライアント（ベース URL + fetch ラッパ）。
 */
const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const ACCESS_TOKEN_KEY = "shiftora_access_token";
const REFRESH_TOKEN_KEY = "shiftora_refresh_token";
const TOKEN_TYPE_KEY = "shiftora_token_type";
const UNAUTHORIZED_EVENT = "shiftora:unauthorized";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
  detail?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function apiUrl(path: string): string {
  const base = getBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function getStoredAuthTokens(): AuthTokens | null {
  if (!canUseStorage()) {
    return null;
  }
  const access_token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh_token = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  const token_type = window.localStorage.getItem(TOKEN_TYPE_KEY) ?? "bearer";
  if (!access_token || !refresh_token) {
    return null;
  }
  return { access_token, refresh_token, token_type };
}

export function setStoredAuthTokens(tokens: AuthTokens): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  window.localStorage.setItem(TOKEN_TYPE_KEY, tokens.token_type || "bearer");
}

export function clearStoredAuthTokens(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_TYPE_KEY);
}

function withAuthHeader(headers: Headers, enabled: boolean): Headers {
  if (!enabled) {
    return headers;
  }
  const tokens = getStoredAuthTokens();
  if (tokens?.access_token) {
    headers.set("Authorization", `Bearer ${tokens.access_token}`);
  }
  return headers;
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }
  const detail = payload?.detail;
  const message =
    detail?.message ??
    payload?.message ??
    (response.statusText || "API request failed");
  return new ApiError(
    response.status,
    message,
    detail?.code ?? payload?.code,
    detail?.details ?? payload?.details,
  );
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<Response> {
  const url = apiUrl(path);
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  withAuthHeader(headers, withAuth);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredAuthTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
  }
  return response;
}

export function unauthorizedEventName(): string {
  return UNAUTHORIZED_EVENT;
}
