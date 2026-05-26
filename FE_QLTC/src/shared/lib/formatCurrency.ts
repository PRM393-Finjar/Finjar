/** Định dạng số tiền VND — BE trả về đơn vị đồng, không quy đổi. */
export function formatVnd(
  amount: number,
  options?: { maximumFractionDigits?: number },
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value);
}
