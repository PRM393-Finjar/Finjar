export interface NotificationMetadata {
  goalId?: string;
  jarId?: string;
  limitId?: string;
  transactionId?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  occurredAt: string;
  metadata?: NotificationMetadata | null;
}

export interface NotificationListParams {
  type?: string;
  status?: "read" | "unread";
  pageSize?: number;
  pageIndex?: number;
}

export interface NotificationListResult {
  items: NotificationItem[];
  totalItems: number;
  pageSize: number;
  pageIndex: number;
  unreadCount: number;
}

export interface UpdateNotificationStatusPayload {
  ids?: string[];
  isRead: boolean;
  markAll?: boolean;
}

export interface UpdateNotificationStatusResult {
  updatedCount: number;
  unreadCount: number;
}
