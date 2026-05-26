import { RecentTransactions } from "../components/RecentTransactions";
import { RecentUsersList } from "../components/RecentUsersList";
import { RetentionCohortChart } from "../components/RetentionCohortChart";
import { StatCard } from "../components/StatCard";
import { TopSpendingCategoriesChart } from "../components/TopSpendingCategoriesChart";
import { TransactionVolumeTrend } from "../components/TransactionVolumeTrend";
import { useAdminDashboardSummary } from "../hooks/useAdminDashboard";

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboardSummary();

  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải dashboard quản trị...</p>;
  if (isError || !data) return <p className="text-sm text-red-500">Không thể tải dữ liệu dashboard quản trị.</p>;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard quản trị</h1>
        <p className="text-sm text-muted-foreground">Theo dõi tổng quan chỉ số vận hành và hoạt động nền tảng.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {data.stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <TransactionVolumeTrend items={data.transactionVolumeTrend} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TopSpendingCategoriesChart items={data.topSpendingCategories} />
        <RetentionCohortChart items={data.retentionTrend} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentUsersList users={data.recentUsers} />
        <RecentTransactions items={data.recentTransactions} />
      </div>
    </section>
  );
}
