const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function getApiUrl(): string {
  return `${BASE}/api`;
}
