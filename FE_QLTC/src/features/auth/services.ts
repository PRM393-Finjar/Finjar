import type { AuthResponse, LoginRequest, RegisterRequest } from "./types";
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
  accessToken: string;
  role?: string | null;
  isOnboardingCompleted?: boolean;
}

function adaptAuthResponse(be: BackendAuthResponse): AuthResponse {
  const first = be.firstName?.trim() ?? "";
  const last = be.lastName?.trim() ?? "";
  return {
    id: be.id,
    username: be.username,
    firstName: first || be.username,
    lastName: last,
    email: be.email,
    role: String(be.role ?? "User"),
    isOnboardingCompleted: be.isOnboardingCompleted ?? true,
    accessToken: be.accessToken,
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

  async register(payload: RegisterRequest): Promise<AuthResponse> {
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
        return adaptAuthResponse(be);
      } catch (e) {
        throw mapAxiosAuthError(e);
      }
    };

    const mockRequest = async () => {
      await wait(300);
      return mockData.auth.register(
        payload.username,
        payload.email,
        payload.firstName,
        payload.lastName,
      );
    };

    return requestWithStrategy(AUTH_STRATEGY.register, realRequest, mockRequest);
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
