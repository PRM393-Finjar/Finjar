/** Gốc API kèm `/api/v1` — axios ghép thêm path trong `API_ENDPOINT` (không lặp `/api/v1`). */
const API_URL =
  import.meta.env.VITE_API_LOCAL_URL ?? "http://localhost:5284/api/v1";

if (!API_URL) {
  throw new Error(
    "❌ MISSING ENVIRONMENT VARIABLE: VITE_API_LOCAL_URL\n" +
      "Please create .env file with: VITE_API_LOCAL_URL=http://localhost:5284/api/v1",
  );
}

const DEV_PREFILL_LOGIN_EMAIL = String(
  import.meta.env.VITE_DEV_PREFILL_LOGIN_EMAIL ?? "",
);
const DEV_PREFILL_LOGIN_PASSWORD = String(
  import.meta.env.VITE_DEV_PREFILL_LOGIN_PASSWORD ?? "",
);

export type RequestMode = "real" | "mock";

function readRequestMode(
  value: string | undefined,
  fallback: RequestMode,
): RequestMode {
  return value === "mock" || value === "real" ? value : fallback;
}

export const env = {
  API_URL,
  AUTH_MODE: readRequestMode(import.meta.env.VITE_AUTH_MODE, "real"),
  DASHBOARD_MODE: readRequestMode(
    import.meta.env.VITE_DASHBOARD_MODE,
    "real",
  ),
  DEV_PREFILL_LOGIN_EMAIL,
  DEV_PREFILL_LOGIN_PASSWORD,
} as const;

export function isMockAccessToken(token: string | null | undefined): boolean {
  return Boolean(token?.startsWith("mock-finjar-token-"));
}
