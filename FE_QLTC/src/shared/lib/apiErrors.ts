import axios from "axios";

export interface ApiErrorBody {
  success?: boolean;
  error?: string;
  message?: string;
  details?: {
    field?: string;
    code?: string;
  };
}

export interface ParsedApiError {
  message: string;
  field?: string;
  code?: string;
}

export const DAILY_TRANSACTION_QUOTA_EXCEEDED =
  "DAILY_TRANSACTION_QUOTA_EXCEEDED";

export const DAILY_TRANSACTION_QUOTA_TITLE = "Hết lượt tạo giao dịch";

/** Mã lỗi BE → thông báo tiếng Việt cho người dùng. */
export const API_ERROR_MESSAGES_VI: Record<string, string> = {
  [DAILY_TRANSACTION_QUOTA_EXCEEDED]:
    "Bạn đã sử dụng hết 10 lượt tạo giao dịch hôm nay.\nVui lòng quay lại vào ngày mai hoặc nâng cấp Premium.",
  INVALID_LOGIN_CREDENTIALS: "Email hoặc mật khẩu không đúng. Bạn kiểm tra lại nhé.",
  INVALID_TOKEN: "Link xác thực không hợp lệ hoặc đã hết hạn. Hãy gửi lại email xác thực.",
  TOKEN_EXPIRED: "Link xác thực đã hết hạn. Vui lòng gửi lại email xác thực.",
  TRANSACTION_DATE_IN_FUTURE: "Bạn chỉ có thể ghi nhận giao dịch đến thời điểm hiện tại.",
  INVALID_TRANSACTION_AMOUNT: "Vui lòng nhập số tiền lớn hơn 0.",
  CATEGORY_NOT_FOUND: "Danh mục này không còn dùng được. Hãy chọn danh mục khác.",
  JAR_NOT_FOUND: "Không tìm thấy hũ này. Hãy chọn hũ khác.",
  FINANCIAL_ACCOUNT_NOT_FOUND: "Không tìm thấy tài khoản này. Hãy chọn tài khoản khác.",
  INSUFFICIENT_JAR_BALANCE: "Trong hũ không đủ tiền cho giao dịch này.",
  INSUFFICIENT_ACCOUNT_BALANCE: "Tài khoản không đủ số dư cho giao dịch này.",
  GOAL_DUE_DATE_IN_PAST: "Hạn mục tiêu phải từ hôm nay trở đi.",
  REMINDER_START_DATE_IN_PAST: "Ngày bắt đầu phải từ hôm nay trở đi.",
  JAR_HAS_RELATED_DATA:
    "Hũ này còn giao dịch hoặc mục tiêu liên quan, nên chưa xóa được.",
};

const VIETNAMESE_TEXT_PATTERN =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function isBackendUserFacingMessage(message: string): boolean {
  return VIETNAMESE_TEXT_PATTERN.test(message);
}

function messageFromCode(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  if (
    code === DAILY_TRANSACTION_QUOTA_EXCEEDED &&
    fallback &&
    isBackendUserFacingMessage(fallback)
  ) {
    return fallback;
  }
  return API_ERROR_MESSAGES_VI[code] ?? fallback;
}

export function isDailyTransactionQuotaExceeded(
  error: Pick<ParsedApiError, "code">,
): boolean {
  return error.code === DAILY_TRANSACTION_QUOTA_EXCEEDED;
}

export function parseApiError(error: unknown): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message:
        error instanceof Error ? error.message : "Có lỗi xảy ra. Bạn thử lại sau nhé.",
    };
  }

  if (!error.response) {
    return {
      message:
        "Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau vài giây.",
    };
  }

  const data = error.response?.data as ApiErrorBody | string | undefined;
  if (typeof data === "string") {
    return { message: data };
  }

  const body = data ?? {};
  const code = body.details?.code
    ?? (typeof body.details === "object" && body.details !== null && "code" in body.details
      ? String((body.details as { code?: string }).code)
      : undefined);
  const rawMsg =
    (typeof body.error === "string" && body.error) ||
    (typeof body.message === "string" && body.message) ||
    "";

  const friendly = messageFromCode(
    code,
    rawMsg || "Có lỗi xảy ra. Bạn thử lại sau nhé.",
  );

  return {
    message: friendly,
    field: body.details?.field,
    code,
  };
}

export function toError(parsed: ParsedApiError): Error {
  const err = new Error(parsed.message);
  (err as Error & { field?: string; code?: string }).field = parsed.field;
  (err as Error & { field?: string; code?: string }).code = parsed.code;
  return err;
}

export function parseApiErrorAsError(error: unknown): Error {
  return toError(parseApiError(error));
}
