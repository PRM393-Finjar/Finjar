import { Link } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationUnreadCount } from "@/features/notifications";
import { ROUTES } from "@/shared/constants/routes";
import { useFinanceDashboard } from "../context/FinanceDashboardContext";
import { useUserAvatarUrl } from "@/features/profile";
import { BrutalIconButton } from "@/shared/components/layout/BrutalIconButton";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { useLogoutMutation } from "@/features/auth/hooks/useAuth";

type FinanceTopBarProps = {
  embedded?: boolean;
  brandName?: string;
};

export function FinanceTopBar({ embedded = false, brandName }: FinanceTopBarProps) {
  const navigate = useNavigate();
  const { tr } = useFinanceDashboard();
  const avatarUrl = useUserAvatarUrl();
  const { data: apiUnreadCount = 0 } = useNotificationUnreadCount();
  const { mutate: logout, isPending } = useLogoutMutation();

  const displayBrand = brandName ?? tr("template");

  return (
    <header className="border-b-2 border-[#0a0a0a] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-extrabold tracking-tight">{displayBrand}</h1>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <BrutalIconButton
            badge={apiUnreadCount > 0}
            aria-label={tr("notifications")}
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          >
            <Bell className="h-4 w-4 stroke-[2.5]" />
          </BrutalIconButton>

          <Link
            to={ROUTES.PROFILE}
            className="rounded-full transition hover:opacity-90"
            aria-label={tr("viewProfile")}
          >
            <UserAvatar size="sm" imageUrl={avatarUrl} />
          </Link>

          {embedded ? (
            <BrutalIconButton
              aria-label={tr("signOut")}
              disabled={isPending}
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 stroke-[2.5]" />
            </BrutalIconButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}
