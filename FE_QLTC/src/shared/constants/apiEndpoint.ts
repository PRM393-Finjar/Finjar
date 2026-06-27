export const API_ENDPOINT = {
  AUTH: {
    LOGIN: "auth/login",
    REGISTER: "auth/register",
    LOGOUT: "auth/logout",
    VERIFY_EMAIL: "auth/verify-email",
    RESEND_VERIFICATION: "auth/resend-verification",
  },
  USER: {
    ME: "user/me",
    SETUP: "user/me/setup",
  },
  /** POST — khớp BE `[Route("api/v1/onboarding")]` */
  ONBOARDING: "onboarding",
  CATEGORIES: {
    LIST: "categories",
    DETAIL: (id: string) => `categories/${id}`,
  },
  ADMIN_CATEGORIES: {
    LIST: "admin/categories",
    DETAIL: (id: string) => `admin/categories/${id}`,
  },
  IMPORTS: {
    BASE: "imports",
    IMAGE: "imports/image",
    DETAIL: (id: string) => `imports/${id}`,
    DRAFT: (id: string, draftId: string) => `imports/${id}/drafts/${draftId}`,
    CONFIRM: (id: string) => `imports/${id}/confirm`,
  },
  LIMITS: "limits",
  REMINDERS: "reminders",
  AI_CHAT: "ai/chat",
  HEALTH: {
    PING: "/health",
    DB_RENDER: "/health/db/render",
    DB_LOCAL: "/health/db/local",
  },
  /** GET/POST/PATCH/DELETE — khớp BE `[Route("api/v1/financial-accounts")]` */
  FINANCIAL_ACCOUNT: "financial-accounts",
  JAR: "jars",
  /** GET/POST/PATCH/DELETE — khớp BE `[Route("api/v1/transactions")]` */
  TRANSACTIONS: "transactions",
  /** GET/POST/PATCH/DELETE — khớp BE `[Route("api/v1/goals")]` */
  GOALS: "goals",
  /** GET — khớp BE `[Route("api/v1/dashboard")]` */
  USER_DASHBOARD: "dashboard",
  /** GET + PATCH status — khớp BE `[Route("api/v1/notifications")]` */
  NOTIFICATIONS: "notifications",
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    CATEGORIES: "/admin/categories",
    BROADCASTS: "/admin/broadcasts",
    AUDIT_LOGS: "/admin/audit-logs",
    AI_SETTINGS: "/admin/ai-settings",
    CHANGE_ROLE: "/change-role",
  },
} as const;
