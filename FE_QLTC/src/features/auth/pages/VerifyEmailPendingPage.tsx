import { useMutation } from "@tanstack/react-query";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Loader2 } from "lucide-react";

import { useState } from "react";

import { AuthPageShell } from "@/shared/components/layout/AuthPageShell";

import { ROUTES } from "@/shared/constants/routes";

import { authService } from "../services";



export function VerifyEmailPendingPage() {

  const navigate = useNavigate();

  const [params] = useSearchParams();

  const email = params.get("email") ?? "";

  const [otp, setOtp] = useState("");



  const verify = useMutation({

    mutationFn: () => authService.verifyEmailOtp(email, otp),

    onSuccess: () => {

      navigate(ROUTES.LOGIN, { replace: true, state: { verifiedEmail: email } });

    },

  });



  const resend = useMutation({

    mutationFn: () => authService.resendVerification(email),

  });



  const otpDigitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 6);



  return (

    <AuthPageShell

      title="Xác thực email"

      description="Nhập mã OTP để hoàn tất đăng ký. Tài khoản chỉ được tạo sau khi xác thực."

      footer={

        <>

          Đã xác thực?{" "}

          <Link to={ROUTES.LOGIN} className="font-extrabold text-[#0a0a0a] underline">

            Đăng nhập

          </Link>

        </>

      }

    >

      <div className="space-y-4 text-sm text-slate-700">

        {email ? (

          <p>

            Nhập mã OTP gửi tới <strong>{email}</strong> (kiểm tra cả thư rác). Mã hết hạn sau 10 phút.

          </p>

        ) : (

          <p>Nhập mã OTP từ email trước khi đăng nhập.</p>

        )}



        <label className="block space-y-1">

          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Mã OTP</span>

          <input

            type="text"

            inputMode="numeric"

            autoComplete="one-time-code"

            maxLength={6}

            placeholder="000000"

            className="brutal-input w-full text-center text-2xl tracking-[0.4em]"

            value={otp}

            onChange={(e) => setOtp(otpDigitsOnly(e.target.value))}

          />

        </label>



        <button

          type="button"

          className="brutal-btn-primary inline-flex h-10 w-full items-center justify-center gap-2 disabled:opacity-60"

          disabled={!email || otp.length !== 6 || verify.isPending}

          onClick={() => verify.mutate()}

        >

          {verify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}

          Xác thực

        </button>



        {verify.isSuccess ? (

          <p className="text-emerald-700">Email đã được xác thực. Chuyển tới đăng nhập…</p>

        ) : null}

        {verify.error ? <p className="brutal-field-error">{verify.error.message}</p> : null}



        <p className="text-xs text-slate-500">

          Dev local: xem mã OTP trong log backend khi chưa bật SMTP.

        </p>



        {email ? (

          <button

            type="button"

            className="brutal-btn-secondary inline-flex h-10 w-full items-center justify-center gap-2 disabled:opacity-60"

            disabled={!email || resend.isPending}

            onClick={() => resend.mutate()}

          >

            {resend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}

            Gửi lại mã OTP

          </button>

        ) : null}

        {resend.isSuccess ? (

          <p className="text-emerald-700">Đã gửi lại mã OTP (nếu email hợp lệ và chưa xác thực).</p>

        ) : null}

        {resend.error ? <p className="brutal-field-error">{resend.error.message}</p> : null}

      </div>

    </AuthPageShell>

  );

}

