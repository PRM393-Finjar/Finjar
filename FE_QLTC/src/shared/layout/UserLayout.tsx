import { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  CircleUserRound,
  Goal,
  Landmark,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  ReceiptText,
  ScanLine,
  Settings,
  Tags,
  WalletCards,
  X,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { UserAppHeader } from "@/shared/components/layout/UserAppHeader";
import { AiChatFab } from "@/features/ai-chat";
import { useAuth, useLogoutMutation } from "@/features/auth/hooks/useAuth";
import { useNotificationUnreadCount } from "@/features/notifications";
const userNavItems = [
  { label: "Dashboard", to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Giao dịch", to: ROUTES.TRANSACTIONS, icon: ReceiptText },
  { label: "Nguồn tiền", to: ROUTES.ACCOUNTS, icon: Landmark },
  { label: "Danh mục", to: ROUTES.CATEGORIES, icon: Tags },
  { label: "Ngân sách", to: ROUTES.BUDGET, icon: WalletCards },
  { label: "Mục tiêu", to: ROUTES.GOALS, icon: Goal },
  { label: "Hũ", to: ROUTES.JARS, icon: PiggyBank },
] as const;

const userNavSecondaryItems = [
  { label: "OCR hóa đơn", to: ROUTES.IMPORTS_OCR, icon: ScanLine },
  { label: "Nhắc lịch", to: ROUTES.REMINDERS, icon: CalendarClock },
  { label: "Bank Accounts", to: ROUTES.SETTINGS_BANK_ACCOUNTS, icon: Settings },
] as const;

const mobilePrimaryItems = [
  userNavItems[0],
  userNavItems[1],
  userNavItems[2],
  userNavItems[5],
  userNavItems[6],
  { label: "Thông báo", to: ROUTES.NOTIFICATIONS, icon: Bell },
] as const;

const mobileMoreItems = [
  ...userNavItems,
  ...userNavSecondaryItems,
  { label: "Hồ sơ", to: ROUTES.PROFILE, icon: CircleUserRound },
] as const;

const desktopSidebarItems = [
  ...userNavItems,
  ...userNavSecondaryItems,
] as const;

function navLinkClass(isActive: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    isActive
      ? "brutal-nav-active"
      : "text-neutral-700 hover:bg-white hover:shadow-[2px_2px_0_0_#0a0a0a]",
  );
}

export function UserLayout() {
  const [openMobileDrawer, setOpenMobileDrawer] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { mutate: logout, isPending } = useLogoutMutation();
  const { data: unreadBadge } = useNotificationUnreadCount();
  const unreadCount = unreadBadge ?? 0;
  const hasUnreadNotifications = unreadCount > 0;
  const isDashboardRoute = location.pathname === ROUTES.DASHBOARD;

  if (
    user &&
    !isAdmin &&
    user.isOnboardingCompleted === false &&
    location.pathname !== ROUTES.ONBOARDING
  ) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return (
    <div className={cn("brutal-app flex min-h-screen flex-col pb-20 md:pb-0")}>
      {!isDashboardRoute ? (
        <UserAppHeader onOpenMobileMenu={() => setOpenMobileDrawer(true)} />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            "hidden w-[260px] shrink-0 flex-col border-r-2 border-[#0a0a0a] bg-white md:sticky md:flex md:self-start",
            isDashboardRoute ? "md:top-0 md:h-dvh" : "md:top-[57px] md:h-[calc(100dvh-57px)]",
          )}
        >
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            {desktopSidebarItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {isActive ? <span className="sr-only"> (đang chọn)</span> : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main
          className={cn(
            "min-w-0 w-full flex-1",
            isDashboardRoute ? "max-w-none p-0" : "mx-auto max-w-7xl p-4 md:p-6",
          )}
        >
          <Outlet />
        </main>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          openMobileDrawer ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpenMobileDrawer(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r-2 border-[#0a0a0a] bg-white p-4 transition-transform md:hidden",
          openMobileDrawer ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-extrabold">FinJar</p>
          <Button
            type="button"
            variant="ghost"
            className="brutal-icon-btn h-10 w-10 p-0"
            onClick={() => setOpenMobileDrawer(false)}
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1">
          {mobileMoreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => navLinkClass(isActive)}
              onClick={() => setOpenMobileDrawer(false)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="brutal-btn-outline mt-auto w-full text-red-600"
              disabled={isPending}
            >
              <LogOut className="h-4 w-4" />
              {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="brutal-card border-0">
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận đăng xuất?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng ứng dụng.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline" className="brutal-btn-outline w-full sm:flex-1">
                  Ở lại
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  className="w-full bg-red-600 text-white hover:bg-red-700 sm:flex-1"
                  onClick={() => {
                    setOpenMobileDrawer(false);
                    logout();
                  }}
                >
                  Đăng xuất
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </aside>

      <AiChatFab />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[#0a0a0a] bg-white md:hidden">
        <div className="mx-auto grid h-16 max-w-xl grid-cols-6 px-0.5">
          {mobilePrimaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex cursor-pointer items-center justify-center px-1 py-1"
            >
              {({ isActive }) => (
                <span
                  className={cn(
                    "relative inline-flex w-full max-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition",
                    isActive ? "brutal-nav-active" : "text-neutral-600",
                  )}
                >
                  <span className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.to === ROUTES.NOTIFICATIONS && hasUnreadNotifications ? (
                      <span
                        className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full border border-[#0a0a0a] bg-red-500"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="max-w-full truncate leading-none">{item.label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
