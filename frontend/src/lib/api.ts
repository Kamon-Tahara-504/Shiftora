/**
 * API クライアント（ベース URL + fetch ラッパ）。
 * 5.1 で JWT 付与・リフレッシュなどを拡張する。
 */
const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export function apiUrl(path: string): string {
  const base = getBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = apiUrl(path);
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
