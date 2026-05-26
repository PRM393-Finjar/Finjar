export interface AdminAuditLogItem {
  id: string;
  adminUsername: string;
  actionType: string;
  entityType: string;
  description: string;
  createdAt: string;
}

export interface AdminAuditLogParams {
  adminId?: string;
  actionType?: string;
  entityType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminAuditPagination {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminAuditLogListResult {
  items: AdminAuditLogItem[];
  pagination: AdminAuditPagination;
}
