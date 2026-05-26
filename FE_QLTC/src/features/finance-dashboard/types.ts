export type ProfileSection = "profile" | "settings" | "billing";

export type Currency = "USD" | "EUR" | "VND";
export type Language = "en" | "vi";
export type UserPreferences = {
  emailNotifications: boolean;
  twoFactor: boolean;
  currency: Currency;
  language: Language;
};

import type { TranslationKey } from "./i18n";

export type NotificationItem = {
  id: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  time: string;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  from: "user" | "support";
  text: string;
  textKey?: TranslationKey;
  time: string;
};
