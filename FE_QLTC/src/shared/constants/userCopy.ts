/** Nhãn hiển thị thân thiện — giữ value gửi BE, chỉ đổi text UI. */

export const TRANSACTION_TYPE_LABELS = {
  Expense: "Chi tiêu",
  Income: "Thu nhập",
  Transfer: "Chuyển tiền",
} as const;

export const GOAL_STATUS_LABELS: Record<string, string> = {
  Active: "Đang tiến hành",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

export const REMINDER_FREQUENCY_LABELS: Record<string, string> = {
  Daily: "Hàng ngày",
  Weekly: "Hàng tuần",
  Monthly: "Hàng tháng",
  Quarterly: "Hàng quý",
  Yearly: "Hàng năm",
};

export const REMINDER_STATUS_LABELS: Record<string, string> = {
  Active: "Đang bật",
  Paused: "Tạm dừng",
  Completed: "Đã xong",
  Cancelled: "Đã hủy",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  SpendingAlert: "Cảnh báo chi tiêu",
  GoalUpdate: "Mục tiêu tiết kiệm",
  Broadcast: "Thông báo hệ thống",
  Reminder: "Nhắc thanh toán",
};

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  Normal: "Ổn định",
  Warning: "Sắp chạm hạn mức",
  Exceeded: "Đã vượt hạn mức",
};

export function labelOf(
  map: Record<string, string>,
  value: string,
  fallback?: string,
): string {
  return map[value] ?? fallback ?? value;
}

/** Tên danh mục mặc định từ BE (tiếng Anh) → nhãn tiếng Việt. */
export const DEFAULT_CATEGORY_NAME_VI: Record<string, string> = {
  "Bills & Housing": "Nhà ở & hóa đơn",
  Education: "Học tập",
  Entertainment: "Giải trí",
  "Food & Dining": "Ăn uống",
  Health: "Sức khỏe",
  Other: "Khác",
  "Savings & Investment": "Tiết kiệm & đầu tư",
  Shopping: "Mua sắm",
  Transportation: "Di chuyển",
};

export function getCategoryDisplayName(
  name?: string | null,
  kind?: "default" | "custom",
): string {
  if (!name?.trim()) return "";
  if (kind === "custom") return name;
  return DEFAULT_CATEGORY_NAME_VI[name] ?? name;
}
