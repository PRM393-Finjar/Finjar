import { Button } from "@/shared/components/ui/button";
import { FinanceDashboard } from "@/features/finance-dashboard";
import { useUserDashboard } from "../hooks/useUserDashboard";
import { getDashboardErrorMessage } from "../services";

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useUserDashboard();

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm font-medium text-neutral-600">
        Đang tải tổng quan...
      </p>
    );
  }

  if (isError || !data) {
    const message =
      error != null
        ? getDashboardErrorMessage(error)
        : "Không tải được dữ liệu tổng quan.";

    return (
      <div className="brutal-card mx-auto max-w-md space-y-3 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{message}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Đang thử lại…" : "Thử lại"}
        </Button>
      </div>
    );
  }

  return <FinanceDashboard embedded dashboardData={data} />;
}
