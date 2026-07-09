/**
 * Optional FastAPI client for local dual-mode development.
 * The public Vercel lab uses the browser engine in `lib/engine`.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchDemo() {
  return getJson("/api/demo");
}

export function runAnalyze() {
  return getJson("/api/analyze", { method: "POST" });
}

export function fetchWeeklyMemo() {
  return getJson("/api/report/weekly");
}
