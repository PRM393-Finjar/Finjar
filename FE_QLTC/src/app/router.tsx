import { createBrowserRouter } from "react-router-dom";
import { LoginPage, RegisterPage, VerifyEmailPendingPage } from "@/features/auth";
import { DashboardPage } from "@/features/dashboard";
import {
  TransactionsPage,
  AddTransactionPage,
  TransactionDetailPage,
} from "@/features/transactions";
import { OcrImportPage } from "@/features/imports";
import { AccountsPage } from "@/features/financial-accounts";
import { JarsPage } from "@/features/jars";
import { BudgetPage } from "@/features/budget";
import { CategoriesPage } from "@/features/categories";
import { RemindersPage } from "@/features/reminders";
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminBroadcastsPage,
  AdminAuditLogsPage,
  AdminAiSettingsPage,
} from "@/features/admin";
import { ROUTES } from "@/shared/constants/routes";
import { GuestRoute } from "@/shared/components/common/GuestRoute";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";
import { NotFoundPage } from "@/shared/pages/NotFoundPage";
import { UnauthorizedPage } from "@/shared/pages/UnauthorizedPage";
import { UserGoalsPage } from "@/shared/pages/UserGoalsPage";
import { UserNotificationsPage } from "@/shared/pages/UserNotificationsPage";
import { UserProfilePage } from "@/features/profile";
import { UserLayout } from "@/shared/layout/UserLayout";
import { AdminLayout } from "@/shared/layout/AdminLayout";
import AdminCategoriesPage from "@/features/admin/category/pages/AdminCategoriesPage";
import { OnboardingPage } from "@/features/onboarding";
export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.REGISTER,
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.VERIFY_EMAIL,
    element: (
      <GuestRoute>
        <VerifyEmailPendingPage />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.VERIFY_EMAIL_PENDING,
    element: (
      <GuestRoute>
        <VerifyEmailPendingPage />
      </GuestRoute>
    ),
  },
  {
    /** Khảo sát ban đầu: chỉ role `user` chưa xong onboarding (admin vào `/admin`). */
    path: ROUTES.ONBOARDING,
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
      { path: ROUTES.TRANSACTIONS, element: <TransactionsPage /> },
      { path: ROUTES.TRANSACTIONS_ADD, element: <AddTransactionPage /> },
      { path: ROUTES.TRANSACTION_DETAIL, element: <TransactionDetailPage /> },
      { path: ROUTES.IMPORTS_OCR, element: <OcrImportPage /> },
      { path: ROUTES.ACCOUNTS, element: <AccountsPage /> },
      { path: ROUTES.JARS, element: <JarsPage /> },
      { path: ROUTES.BUDGET, element: <BudgetPage /> },
      { path: ROUTES.LIMITS, element: <BudgetPage /> },
      { path: ROUTES.CATEGORIES, element: <CategoriesPage /> },
      { path: ROUTES.REMINDERS, element: <RemindersPage /> },
      { path: ROUTES.GOALS, element: <UserGoalsPage /> },
      { path: ROUTES.NOTIFICATIONS, element: <UserNotificationsPage /> },
      { path: ROUTES.PROFILE, element: <UserProfilePage /> },
    ],
  },
  {
    path: ROUTES.ADMIN_DASHBOARD,
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "notifications", element: <AdminBroadcastsPage /> },
      { path: "audit-logs", element: <AdminAuditLogsPage /> },
      { path: "categories", element: <AdminCategoriesPage /> },
      { path: "ai-settings", element: <AdminAiSettingsPage /> },
    ],
  },
  {
    path: ROUTES.UNAUTHORIZED,
    element: <UnauthorizedPage />,
  },
  {
    path: ROUTES.ROOT,
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
