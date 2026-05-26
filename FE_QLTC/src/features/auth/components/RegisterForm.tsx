import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { registerSchema, type RegisterFormData } from "../schema";
import { useRegisterMutation } from "../hooks/useAuth";

export function RegisterForm() {
  const { mutate: registerUser, isPending, error } = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        registerUser({
          username: data.username,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      )}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          type="text"
          placeholder="tên_đăng_nhập"
          {...register("username")}
        />
        {errors.username ? (
          <p className="brutal-field-error">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lastName">Họ</Label>
          <Input
            id="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Nguyễn"
            {...register("lastName")}
          />
          {errors.lastName ? (
            <p className="brutal-field-error">{errors.lastName.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">Tên</Label>
          <Input
            id="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Văn A"
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="brutal-field-error">{errors.firstName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registerEmail">Địa chỉ email</Label>
        <Input
          id="registerEmail"
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
        <Label htmlFor="registerPassword">Mật khẩu</Label>
        <Input
          id="registerPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password ? (
          <p className="brutal-field-error">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="brutal-field-error">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      {error ? <p className="brutal-field-error">{error.message}</p> : null}

      <button
        type="submit"
        className="brutal-btn-primary inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>{isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</span>
      </button>
    </form>
  );
}
