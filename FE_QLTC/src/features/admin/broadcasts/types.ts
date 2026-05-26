export interface AdminBroadcast {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  targetCount: number;
  deliveredCount: number;
}

export interface AdminBroadcastListParams {
  pageIndex?: number;
  pageSize?: number;
  status?: string;
}

export interface AdminBroadcastPagination {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminBroadcastListResult {
  items: AdminBroadcast[];
  pagination: AdminBroadcastPagination;
}

export interface CreateBroadcastPayload {
  title: string;
  body: string;
  targetAudience?: string;
  scheduledAt?: string | null;
}
