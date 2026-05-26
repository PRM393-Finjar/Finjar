import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants";
import type { CurrentUser, UpdateProfilePayload } from "./types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function optStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** Chuẩn hóa GET /api/v1/user/me (camelCase / PascalCase / userName). */
export function normalizeMePayload(raw: unknown): CurrentUser {
  const r = raw as Record<string, unknown>;
  const username = str(r.username ?? r.userName ?? r.UserName);
  return {
    id: str(r.id ?? r.Id),
    username,
    firstName: str(r.firstName ?? r.FirstName),
    lastName: str(r.lastName ?? r.LastName),
    email: str(r.email ?? r.Email),
    phone: optStr(r.phone ?? r.Phone),
    avatarUrl: optStr(r.avatarUrl ?? r.AvatarUrl),
    preferredCurrency: str(r.preferredCurrency ?? r.PreferredCurrency) || "VND",
    isOnboardingCompleted: Boolean(
      r.isOnboardingCompleted ?? r.IsOnboardingCompleted,
    ),
  };
}

export const profileService = {
  async getMe(): Promise<CurrentUser> {
    const raw = await apiClient.get(API_ENDPOINT.USER.ME);
    return normalizeMePayload(raw);
  },

  /** PATCH /api/v1/user/me — chỉ gửi field cần đổi (null = xóa phone/avatar URL). */
  async updateMe(payload: UpdateProfilePayload): Promise<CurrentUser> {
    const body: Record<string, string | null> = {};
    if (payload.firstName !== undefined) {
      body.firstName = payload.firstName;
    }
    if (payload.lastName !== undefined) {
      body.lastName = payload.lastName;
    }
    if (payload.phone !== undefined) {
      body.phone = payload.phone;
    }
    if (payload.avatarUrl !== undefined) {
      body.avatarUrl = payload.avatarUrl;
    }
    if (payload.preferredCurrency !== undefined) {
      body.preferredCurrency = payload.preferredCurrency;
    }
    await apiClient.patch(API_ENDPOINT.USER.ME, body);
    return profileService.getMe();
  },
};
