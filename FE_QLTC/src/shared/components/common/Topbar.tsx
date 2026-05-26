import { useAuth, useLogoutMutation } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";

export function Topbar() {
  const { role } = useAuth();
  const { mutate: logout, isPending } = useLogoutMutation();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <p className="text-sm font-medium">Personal Finance App</p>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase text-muted-foreground">{role ?? "guest"}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
            {isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
