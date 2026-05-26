export const PROFILE_CURRENCY_OPTIONS = [
  { code: "VND", label: "Việt Nam đồng (₫)" },
  { code: "USD", label: "Đô la Mỹ ($)" },
  { code: "JPY", label: "Yên Nhật (¥)" },
] as const;

export type ProfileCurrencyCode = (typeof PROFILE_CURRENCY_OPTIONS)[number]["code"];

export function normalizeProfileCurrency(code: string): ProfileCurrencyCode {
  const upper = code.trim().toUpperCase();
  if (upper === "VND" || upper === "USD" || upper === "JPY") return upper;
  return "VND";
}

export function getProfileCurrencyLabel(code: string): string {
  const normalized = normalizeProfileCurrency(code);
  return (
    PROFILE_CURRENCY_OPTIONS.find((o) => o.code === normalized)?.label ?? "Việt Nam đồng (₫)"
  );
}
