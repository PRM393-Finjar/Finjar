import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { AuthPageShell } from "@/shared/components/layout/AuthPageShell";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  return (
    <AuthPageShell
      title="Tạo tài khoản"
      description="Thiết lập hồ sơ để bắt đầu quản lý tài chính của bạn."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-extrabold text-[#0a0a0a] underline"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
