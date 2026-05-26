import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";
import type { AdminAiSettingsDto, UpdateAdminAiSettingsPayload } from "./types";

function normalizeSettings(raw: unknown): AdminAiSettingsDto {
  if (!raw || typeof raw !== "object") {
    throw new Error("Phản hồi cấu hình AI không hợp lệ");
  }
  const o = raw as Record<string, unknown>;
  const temp = o.temperature ?? o.Temperature;
  const max = o.maxTokens ?? o.MaxTokens;
  const enabled = o.isEnabled ?? o.IsEnabled;
  const masked = o.apiKeyMasked ?? o.ApiKeyMasked;
  return {
    modelName: String(o.modelName ?? o.ModelName ?? ""),
    systemPrompt: String(o.systemPrompt ?? o.SystemPrompt ?? ""),
    temperature: typeof temp === "number" ? temp : Number(temp ?? 0.7),
    maxTokens: typeof max === "number" ? max : Number(max ?? 1000),
    isEnabled: Boolean(enabled),
    apiKeyMasked:
      masked === null || masked === undefined ? null : String(masked),
  };
}

export const adminAiSettingsService = {
  async get(): Promise<AdminAiSettingsDto> {
    const raw = (await apiClient.get(API_ENDPOINT.ADMIN.AI_SETTINGS)) as unknown;
    return normalizeSettings(raw);
  },

  async update(payload: UpdateAdminAiSettingsPayload): Promise<void> {
    const body: Record<string, unknown> = {
      modelName: payload.modelName,
      systemPrompt: payload.systemPrompt,
      temperature: payload.temperature,
      maxTokens: payload.maxTokens,
      isEnabled: payload.isEnabled,
    };
    const key = payload.apiKey?.trim();
    if (key) body.apiKey = key;

    await apiClient.patch(API_ENDPOINT.ADMIN.AI_SETTINGS, body);
  },
};
