const BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  import.meta.env.BASE_URL?.replace(/\/$/, "") ??
  "";

export function getApiUrl(): string {
  return `${BASE}/api`;
}
