import type { Currency } from "../types";

/** Tỷ giá mock — USD là gốc */
const RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  VND: 24_500,
};

const LOCALE: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  VND: "vi-VN",
};

export function convertFromUsd(amountUsd: number, currency: Currency): number {
  return amountUsd * RATES[currency];
}

export function formatMoney(
  amountUsd: number,
  currency: Currency,
  options?: { maximumFractionDigits?: number },
): string {
  const value = convertFromUsd(amountUsd, currency);
  const digits =
    options?.maximumFractionDigits ??
    (currency === "VND" ? 0 : value % 1 === 0 ? 0 : 2);

  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
  }).format(value);
}
