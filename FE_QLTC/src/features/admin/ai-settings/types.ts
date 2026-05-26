/** Khớp GET `/api/v1/admin/ai-settings` (JSON camelCase). */
export interface AdminAiSettingsDto {
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isEnabled: boolean;
  apiKeyMasked: string | null;
}

/** Body PATCH — gửi đủ field; `apiKey` chỉ khi đổi key (optional). */
export interface UpdateAdminAiSettingsPayload {
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isEnabled: boolean;
  apiKey?: string | null;
}
