import type { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse } from "./types";
import { mapAxiosAuthError } from "./backendAuth";
import { apiClient } from "@/lib/axios";
import { mockData } from "@/lib/mockData";
import { env } from "@/lib/env";
import { requestWithStrategy, wait } from "@/lib/requestStrategy";
import { API_ENDPOINT } from "@/shared/constants";

/**
 * Body login/register từ BE (camelCase, một object).
 * `isOnboardingCompleted`: BE gửi boolean; nếu thiếu, FE coi như đã xong để không kẹt wizard.
 */
interface BackendAuthResponse {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  accessToken?: string | null;
  role?: string | null;
  isOnboardingCompleted?: boolean;
  isEmailVerified?: boolean;
  requiresEmailVerification?: boolean;
  message?: string | null;
}

function adaptAuthResponse(be: BackendAuthResponse): AuthResponse {
  const first = be.firstName?.trim() ?? "";
  const last = be.lastName?.trim() ?? "";
  const token = be.accessToken?.trim();
  if (!token) {
    throw new Error("Thiếu access token trong phản hồi đăng nhập.");
  }
  return {
    id: be.id,
    username: be.username,
    firstName: first || be.username,
    lastName: last,
    email: be.email,
    role: String(be.role ?? "User"),
    isOnboardingCompleted: be.isOnboardingCompleted ?? true,
    isEmailVerified: be.isEmailVerified ?? true,
    accessToken: token,
  };
}

function adaptRegisterResponse(be: BackendAuthResponse): RegisterResponse {
  const first = be.firstName?.trim() ?? "";
  const last = be.lastName?.trim() ?? "";
  return {
    id: be.id,
    username: be.username,
    firstName: first || be.username,
    lastName: last,
    email: be.email,
    role: String(be.role ?? "User"),
    isOnboardingCompleted: be.isOnboardingCompleted ?? false,
    isEmailVerified: be.isEmailVerified ?? false,
    requiresEmailVerification: be.requiresEmailVerification ?? !be.accessToken,
    accessToken: be.accessToken ?? null,
    message: be.message ?? null,
  };
}

const AUTH_STRATEGY = {
  login: "real" as RequestMode,
  register: "real" as RequestMode,
  logout: "real" as RequestMode,
} as const;

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const realRequest = async () => {
      try {
        const be = (await apiClient.post<BackendAuthResponse>(
          API_ENDPOINT.AUTH.LOGIN,
          {
            email: payload.email.trim(),
            password: payload.password,
          },
        )) as unknown as BackendAuthResponse;
        return adaptAuthResponse(be);
      } catch (e) {
        throw mapAxiosAuthError(e);
      }
    };

    const mockRequest = async () => {
      await wait(300);
      return mockData.auth.login(payload.email);
    };

    return requestWithStrategy(AUTH_STRATEGY.login, realRequest, mockRequest);
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const realRequest = async () => {
      try {
        const be = (await apiClient.post<BackendAuthResponse>(
          API_ENDPOINT.AUTH.REGISTER,
          {
            username: payload.username.trim(),
            email: payload.email.trim(),
            password: payload.password,
            firstName: payload.firstName.trim(),
            lastName: payload.lastName.trim(),
          },
        )) as unknown as BackendAuthResponse;
        return adaptRegisterResponse(be);
      } catch (e) {
        throw mapAxiosAuthError(e);
      }
    };

    const mockRequest = async () => {
      await wait(300);
      const mock = mockData.auth.register(
        payload.username,
        payload.email,
        payload.firstName,
        payload.lastName,
      );
      return adaptRegisterResponse({
        ...mock,
        requiresEmailVerification: false,
        isEmailVerified: true,
      });
    };

    return requestWithStrategy(AUTH_STRATEGY.register, realRequest, mockRequest);
  },

  async verifyEmailOtp(email: string, otp: string): Promise<{ message: string }> {
    try {
      const be = (await apiClient.post<{ message: string }>(
        API_ENDPOINT.AUTH.VERIFY_EMAIL,
        { email: email.trim(), otp: otp.trim() },
      )) as unknown as { message: string };
      return be;
    } catch (e) {
      throw mapAxiosAuthError(e);
    }
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const be = (await apiClient.post<{ message: string }>(
      API_ENDPOINT.AUTH.RESEND_VERIFICATION,
      { email: email.trim() },
    )) as unknown as { message: string };
    return be;
  },

  async logout(): Promise<void> {
    const realRequest = async () => {
      await apiClient.post(API_ENDPOINT.AUTH.LOGOUT);
    };

    const mockRequest = async () => {
      await wait(200);
    };

    return requestWithStrategy(AUTH_STRATEGY.logout, realRequest, mockRequest);
  },
};
