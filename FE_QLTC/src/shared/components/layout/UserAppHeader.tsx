import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { useUserAvatarUrl } from "@/features/profile";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNotificationUnreadCount } from "@/features/notifications";

type UserAppHeaderProps = {
  onOpenMobileMenu: () => void;
};

export function UserAppHeader({ onOpenMobileMenu }: UserAppHeaderProps) {
  const { user } = useAuth();
  const avatarUrl = useUserAvatarUrl();
  const { data: unreadBadge } = useNotificationUnreadCount();
  const hasUnread = (unreadBadge ?? 0) > 0;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    "Tài khoản";

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b-2 border-[#0a0a0a] bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="brutal-icon-btn h-10 w-10 shrink-0 p-0 md:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          to={ROUTES.DASHBOARD}
          className="text-xl font-extrabold tracking-tight hover:opacity-90"
        >
          FinJar
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to={ROUTES.NOTIFICATIONS}
            className="brutal-icon-btn relative"
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            {hasUnread ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-[#0a0a0a] bg-red-500" />
            ) : null}
          </Link>
          <Link
            to={ROUTES.PROFILE}
            className={cn(
              "brutal-pill hidden items-center gap-2 px-3 py-1.5 text-sm font-semibold sm:inline-flex",
            )}
          >
            <UserAvatar size="sm" imageUrl={avatarUrl} className="!h-8 !w-8 !border" />
            <span className="max-w-[120px] truncate">{displayName}</span>
          </Link>
          <Link
            to={ROUTES.PROFILE}
            className="brutal-icon-btn p-0 sm:hidden"
            aria-label="Hồ sơ"
          >
            <UserAvatar size="sm" imageUrl={avatarUrl} className="!h-9 !w-9" />
          </Link>
        </div>
      </div>
    </header>
  );
}
