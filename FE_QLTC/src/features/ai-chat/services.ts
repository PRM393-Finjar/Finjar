import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "@/shared/constants/apiEndpoint";

export interface AiChatMessage {
  sender: "User" | "AI";
  content: string;
}

export interface AiChatResponse {
  answer: string;
  suggestions?: string[];
  source?: "AI" | "RuleBased" | string;
}

export const aiChatService = {
  async send(
    message: string,
    recentMessages?: AiChatMessage[],
  ): Promise<AiChatResponse> {
    return (await apiClient.post(API_ENDPOINT.AI_CHAT, {
      message: message.trim(),
      recentMessages: recentMessages?.length ? recentMessages : undefined,
    })) as AiChatResponse;
  },
};
