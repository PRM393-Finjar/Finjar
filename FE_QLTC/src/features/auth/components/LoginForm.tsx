import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { env } from "@/lib/env";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ROUTES } from "@/shared/constants/routes";
import { loginSchema, type LoginFormData } from "../schema";
import { useLoginMutation } from "../hooks/useAuth";
import { authService } from "../services";

export function LoginForm() {
  const { mutate: login, isPending, error } = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const resend = useMutation({
    mutationFn: (email: string) => authService.resendVerification(email),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      email:
        env.DEV_PREFILL_LOGIN_EMAIL.length > 0
          ? env.DEV_PREFILL_LOGIN_EMAIL
          : "anh@finjar.app",
      password:
        env.DEV_PREFILL_LOGIN_PASSWORD.length > 0
          ? env.DEV_PREFILL_LOGIN_PASSWORD
          : "123456",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => {
        setLastEmail(data.email);
        login(data);
      })}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Địa chỉ email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ten@email.com"
          {...register("email")}
        />
        {errors.email ? (
          <p className="brutal-field-error">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-11"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-neutral-500 transition-colors hover:text-[#0a0a0a]"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="brutal-field-error">{errors.password.message}</p>
        ) : null}
      </div>

      {error ? <p className="brutal-field-error">{error.message}</p> : null}
      {error?.message.toLowerCase().includes("xác thực") && lastEmail ? (
        <div className="space-y-2 text-sm">
          <button
            type="button"
            className="font-extrabold underline"
            disabled={resend.isPending}
            onClick={() => resend.mutate(lastEmail)}
          >
            Gửi lại mã OTP
          </button>
          <Link to={`${ROUTES.VERIFY_EMAIL_PENDING}?email=${encodeURIComponent(lastEmail)}`} className="block underline">
            Nhập mã OTP xác thực
          </Link>
          {resend.isSuccess ? <p className="text-emerald-700">Đã gửi lại mã OTP (nếu hợp lệ).</p> : null}
        </div>
      ) : null}

      <button
        type="submit"
        className="brutal-btn-primary inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>{isPending ? "Đang đăng nhập…" : "Đăng nhập"}</span>
      </button>
    </form>
  );
}
