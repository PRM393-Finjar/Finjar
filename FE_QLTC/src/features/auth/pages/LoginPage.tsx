import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { AuthPageShell } from "@/shared/components/layout/AuthPageShell";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <AuthPageShell
      title="Đăng nhập"
      description="Đăng nhập để truy cập ví của bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-extrabold text-[#0a0a0a] underline"
          >
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthPageShell>
  );
}
