import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

export function UnauthorizedPage() {
  return (
    <main className="brutal-auth flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="brutal-card max-w-md border-0 p-8">
        <p className="text-6xl font-extrabold">403</p>
        <h1 className="mt-2 text-xl font-extrabold">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Tài khoản của bạn không được phép xem trang này.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="brutal-btn-primary mt-6 inline-flex h-10 items-center justify-center px-6 text-sm"
        >
          Đăng nhập lại
        </Link>
      </div>
    </main>
  );
}
