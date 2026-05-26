import { useRef, useState } from "react";
import { ArrowLeft, Building2, Check, Copy, Mail, Shield, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  readImageFileAsDataUrl,
  useUpdateProfile,
  useUserAvatarUrl,
} from "@/features/profile";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { mockUser } from "../mockData";
import { useFinanceDashboard } from "../context/FinanceDashboardContext";
import type { Currency, Language, ProfileSection } from "../types";
import { SectionCard } from "./shared";

type ProfileScreenProps = {
  section: ProfileSection;
  onBack: () => void;
  onSectionChange: (section: ProfileSection) => void;
};

export function ProfileScreen({
  section,
  onBack,
  onSectionChange,
}: ProfileScreenProps) {
  const {
    preferences,
    setPreferences,
    updatePreferences,
    tr,
    format,
    currency,
  } = useFinanceDashboard();
  const avatarUrl = useUserAvatarUrl();
  const { mutateAsync: saveProfile, isPending: savingAvatar } =
    useUpdateProfile();

  const [displayName, setDisplayName] = useState(mockUser.name);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setPreferences(preferences);
    toast.success(tr("changesSaved"), {
      description: `${tr("currency")}: ${currency}`,
    });
  };

  const onCurrencyChange = (value: Currency) => {
    updatePreferences({ currency: value });
    toast.success(`${tr("currencyUpdated")} ${value}`, {
      description: format(80_000),
    });
  };

  const onLanguageChange = (value: Language) => {
    updatePreferences({ language: value });
    toast.success(tr("languageUpdated"));
  };

  const handleAvatarFile = async (file: File) => {
    try {
      const url = await readImageFileAsDataUrl(file);
      await saveProfile({ avatarUrl: url });
      toast.success(tr("avatarUpdated"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : tr("avatarImageOnly");
      toast.error(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    try {
      await saveProfile({ avatarUrl: null });
      toast.success(tr("avatarUpdated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xóa được ảnh.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyAccountId = async () => {
    await navigator.clipboard.writeText(mockUser.id);
    setCopied(true);
    toast.message(tr("accountIdCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const sectionTitle = {
    profile: tr("profile"),
    settings: tr("settings"),
    billing: tr("billing"),
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {tr("backToDashboard")}
      </button>

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {(["profile", "settings", "billing"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSectionChange(s)}
            className={cn(
              "relative px-4 pb-3 text-sm font-medium transition",
              section === s
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-400 hover:text-neutral-600",
            )}
          >
            {sectionTitle[s]}
            {section === s ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-900 dark:bg-white" />
            ) : null}
          </button>
        ))}
      </div>

      {section === "profile" && (
        <>
          <SectionCard className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">
            <UserAvatar size="lg" imageUrl={avatarUrl} />
            <div className="mt-4 sm:mt-0 sm:ml-6">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <p className="text-neutral-500">{mockUser.role}</p>
              <span className="mt-2 inline-block rounded-full bg-neutral-900 px-3 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">
                {mockUser.plan} plan
              </span>
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-500">
                    {tr("email")}
                  </p>
                  <p className="font-medium">{mockUser.email}</p>
                </div>
              </div>
            </SectionCard>
            <SectionCard>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-500">
                    {tr("company")}
                  </p>
                  <p className="font-medium">{mockUser.company}</p>
                </div>
              </div>
            </SectionCard>
            <SectionCard>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-500">
                    {tr("memberSince")}
                  </p>
                  <p className="font-medium">{mockUser.memberSince}</p>
                </div>
              </div>
            </SectionCard>
            <SectionCard>
              <p className="text-xs font-medium uppercase text-neutral-500">
                {tr("accountId")}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-mono text-sm">{mockUser.id}</p>
                <button
                  type="button"
                  onClick={() => void copyAccountId()}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Copy account ID"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </SectionCard>
          </div>

          <PreferencesPanel
            preferences={preferences}
            onCurrencyChange={onCurrencyChange}
            onLanguageChange={onLanguageChange}
            onAvatarUpload={() => fileInputRef.current?.click()}
            onAvatarRemove={() => void removeAvatar()}
            onAvatarFile={(file) => void handleAvatarFile(file)}
            fileInputRef={fileInputRef}
            avatarUrl={avatarUrl}
            savingAvatar={savingAvatar}
            onToggle={(patch) => updatePreferences(patch)}
            onSave={handleSave}
            tr={tr}
          />
        </>
      )}

      {section === "settings" && (
        <SectionCard className="space-y-5">
          <h3 className="font-semibold">{tr("settings")}</h3>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{tr("displayName")}</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <PreferencesPanel
            preferences={preferences}
            onCurrencyChange={onCurrencyChange}
            onLanguageChange={onLanguageChange}
            onAvatarUpload={() => fileInputRef.current?.click()}
            onAvatarRemove={() => void removeAvatar()}
            onAvatarFile={(file) => void handleAvatarFile(file)}
            fileInputRef={fileInputRef}
            avatarUrl={avatarUrl}
            savingAvatar={savingAvatar}
            onToggle={(patch) => updatePreferences(patch)}
            onSave={handleSave}
            tr={tr}
            embedded
          />
        </SectionCard>
      )}

      {section === "billing" && (
        <div className="space-y-4">
          <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">{tr("currentPlan")}</p>
                <p className="text-xl font-bold">{mockUser.plan}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {format(29)} {tr("perMonth")}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  toast.message("Upgrade flow", {
                    description: "Mock — connect Stripe later.",
                  })
                }
                className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
              >
                {tr("upgradePlan")}
              </button>
            </div>
          </SectionCard>
          <SectionCard>
            <h3 className="font-semibold">{tr("paymentMethod")}</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Visa ending in 4242 · Expires 12/28
            </p>
          </SectionCard>
          <SectionCard>
            <h3 className="mb-3 font-semibold">{tr("invoices")}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { id: "INV-1042", date: "May 01, 2026", amountUsd: 29 },
                { id: "INV-1038", date: "Apr 01, 2026", amountUsd: 29 },
              ].map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3 dark:border-neutral-800"
                >
                  <span>
                    {inv.id} · {inv.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.success(`Downloaded ${inv.id}`)}
                    className="font-medium"
                  >
                    {format(inv.amountUsd)} ↓
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function PreferencesPanel({
  preferences,
  onCurrencyChange,
  onLanguageChange,
  onAvatarUpload,
  onAvatarRemove,
  onAvatarFile,
  fileInputRef,
  avatarUrl,
  savingAvatar,
  onToggle,
  onSave,
  tr,
  embedded,
}: {
  preferences: ReturnType<typeof useFinanceDashboard>["preferences"];
  onCurrencyChange: (c: Currency) => void;
  onLanguageChange: (l: Language) => void;
  onAvatarUpload: () => void;
  onAvatarRemove: () => void;
  onAvatarFile: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  avatarUrl: string | null;
  savingAvatar?: boolean;
  onToggle: (patch: Partial<typeof preferences>) => void;
  onSave: () => void;
  tr: (key: import("../i18n").TranslationKey) => string;
  embedded?: boolean;
}) {
  const content = (
    <>
      <h3 className={embedded ? "pt-2 font-semibold" : "font-semibold"}>
        {tr("preferences")}
      </h3>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">{tr("avatarUpload")}</p>
        <p className="mb-3 text-xs text-neutral-500">{tr("avatarUploadHint")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAvatarFile(file);
          }}
        />
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar size="md" imageUrl={avatarUrl} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAvatarUpload}
              disabled={savingAvatar}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              <Upload className="h-4 w-4" />
              {savingAvatar ? "…" : tr("avatarUpload")}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                onClick={onAvatarRemove}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium dark:border-neutral-700"
              >
                {tr("avatarRemove")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        <li className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <span>{tr("emailNotifications")}</span>
          <Toggle
            checked={preferences.emailNotifications}
            onChange={(v) => onToggle({ emailNotifications: v })}
          />
        </li>
        <li className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <span>{tr("twoFactor")}</span>
          <Toggle
            checked={preferences.twoFactor}
            onChange={(v) => onToggle({ twoFactor: v })}
          />
        </li>
        <li className="flex items-center justify-between gap-4 rounded-lg border border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <span>{tr("currency")}</span>
          <Select
            value={preferences.currency}
            onValueChange={(v) => onCurrencyChange(v as Currency)}
          >
            <SelectTrigger className="h-8 w-[120px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="VND">VND (₫)</SelectItem>
            </SelectContent>
          </Select>
        </li>
        <li className="flex items-center justify-between gap-4 rounded-lg border border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <span>{tr("language")}</span>
          <Select
            value={preferences.language}
            onValueChange={(v) => onLanguageChange(v as Language)}
          >
            <SelectTrigger className="h-8 w-[120px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{tr("english")}</SelectItem>
              <SelectItem value="vi">{tr("vietnamese")}</SelectItem>
            </SelectContent>
          </Select>
        </li>
      </ul>
      <button
        type="button"
        onClick={onSave}
        className="mt-4 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        {tr("saveChanges")}
      </button>
    </>
  );

  if (embedded) return content;
  return <SectionCard>{content}</SectionCard>;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
