export const CATEGORY_ICON_OPTIONS = [
  { id: "shopping", label: "Mua sắm" },
  { id: "food", label: "Ăn uống" },
  { id: "transport", label: "Di chuyển" },
  { id: "home", label: "Nhà ở" },
  { id: "health", label: "Sức khỏe" },
  { id: "education", label: "Học tập" },
  { id: "entertainment", label: "Giải trí" },
  { id: "gift", label: "Quà tặng" },
  { id: "salary", label: "Lương" },
  { id: "investment", label: "Đầu tư" },
  { id: "wallet", label: "Ví" },
  { id: "other", label: "Khác" },
] as const;

export const CATEGORY_COLOR_OPTIONS = [
  "#a8e087",
  "#a5a6f6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#0EA5E9",
  "#64748B",
] as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value.trim());
}
