import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Pencil, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/lib/utils";
import { readImageFileAsDataUrl } from "../lib/avatarFile";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { useUserAvatarUrl } from "../hooks/useUserAvatarUrl";
import {
  PROFILE_CURRENCY_OPTIONS,
  normalizeProfileCurrency,
  type ProfileCurrencyCode,
} from "../constants/currencyOptions";

function FieldRow({
  label,
  value,
  breakWords = false,
}: {
  label: string;
  value: string;
  breakWords?: boolean;
}) {
  return (
    <div className="border-b-2 border-neutral-100 py-3.5 last:border-0">
      <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold text-neutral-900",
          breakWords && "break-all",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CurrencySelectRow({
  value,
  disabled,
  onChange,
}: {
  value: ProfileCurrencyCode;
  disabled?: boolean;
  onChange: (code: ProfileCurrencyCode) => void;
}) {
  return (
    <div className="border-b-2 border-neutral-100 py-3.5 last:border-0">
      <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">
        Tiền tệ
      </p>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next as ProfileCurrencyCode)}
      >
        <SelectTrigger className="mt-2 h-11 w-full max-w-md">
          <SelectValue placeholder="Chọn tiền tệ" />
        </SelectTrigger>
        <SelectContent>
          {PROFILE_CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function UserProfilePage() {
  const { data, isLoading, isError, error } = useCurrentUser();
  const avatarUrlFromApi = useUserAvatarUrl();
  const { mutateAsync: saveProfile, isPending: saving } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
  const [draftCurrency, setDraftCurrency] = useState<ProfileCurrencyCode>("VND");
  const [currencySaving, setCurrencySaving] = useState(false);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
    setIsAvatarModalOpen(false);
  };

  const handleSelectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setAvatarPreview(dataUrl);
      setDraftAvatarUrl(dataUrl);
      setAvatarLoadFailed(false);
      await saveProfile({ avatarUrl: dataUrl });
      setAvatarPreview(null);
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được ảnh");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEdit = () => {
    if (!data) return;
    setDraftFirstName(data.firstName);
    setDraftLastName(data.lastName);
    setDraftPhone(data.phone ?? "");
    setDraftAvatarUrl(data.avatarUrl ?? "");
    setDraftCurrency(normalizeProfileCurrency(data.preferredCurrency));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (data) {
      setDraftFirstName(data.firstName);
      setDraftLastName(data.lastName);
      setDraftPhone(data.phone ?? "");
      setDraftAvatarUrl(data.avatarUrl ?? "");
      setDraftCurrency(normalizeProfileCurrency(data.preferredCurrency));
    }
  };

  const handleSave = async () => {
    if (!data) return;
    try {
      await saveProfile({
        firstName: draftFirstName.trim(),
        lastName: draftLastName.trim(),
        phone: draftPhone.trim() === "" ? null : draftPhone.trim(),
        avatarUrl: draftAvatarUrl.trim() === "" ? null : draftAvatarUrl.trim(),
        preferredCurrency: draftCurrency,
      });
      setIsEditing(false);
      setAvatarPreview(null);
      toast.success("Đã cập nhật hồ sơ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được hồ sơ");
    }
  };

  const handleCurrencyChange = async (next: ProfileCurrencyCode) => {
    if (!data || isEditing) {
      setDraftCurrency(next);
      return;
    }
    const current = normalizeProfileCurrency(data.preferredCurrency);
    if (next === current) return;

    setCurrencySaving(true);
    try {
      await saveProfile({ preferredCurrency: next });
      toast.success("Đã cập nhật tiền tệ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được tiền tệ");
    } finally {
      setCurrencySaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="brutal-card border-0 p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="brutal-error-box text-sm text-red-800">
        <p className="font-medium">Không tải được hồ sơ</p>
        <p className="mt-1 text-red-700">
          {error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi gọi API user/me."}
        </p>
      </div>
    );
  }

  const displayName =
    [data.lastName, data.firstName].filter(Boolean).join(" ").trim() || "—";

  const effectiveAvatar =
    avatarPreview ??
    (isEditing ? draftAvatarUrl.trim() || data.avatarUrl : avatarUrlFromApi);
  const canShowAvatarImage =
    Boolean(effectiveAvatar && effectiveAvatar.trim()) && !avatarLoadFailed;

  const currencyValue = isEditing
    ? draftCurrency
    : normalizeProfileCurrency(data.preferredCurrency);

  return (
    <>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card className="brutal-card border-0 shadow-none">
          <CardHeader className="space-y-0 pb-4">
            <div className="flex flex-col items-center gap-5 border-b-2 border-neutral-100 pb-6 sm:flex-row sm:items-center sm:gap-6">
              <button
                type="button"
                className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[#0a0a0a] bg-[#a8e087]/30 shadow-[3px_3px_0_0_#0a0a0a]"
                onClick={() => setIsAvatarModalOpen(true)}
                aria-label="Đổi ảnh đại diện"
              >
                {canShowAvatarImage ? (
                  <img
                    src={effectiveAvatar ?? ""}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-10 w-10 text-neutral-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
                  <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
                </div>
              </button>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <CardTitle className="break-all text-2xl font-semibold text-neutral-900">
                  {data.username}
                </CardTitle>
                <p className="mt-1 text-sm font-medium text-neutral-600">
                  {displayName}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {!isEditing ? (
                <button
                  type="button"
                  className="brutal-btn-outline inline-flex h-10 min-w-[200px] cursor-pointer items-center justify-center gap-1.5 px-6 text-sm font-bold"
                  onClick={startEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </button>
              ) : (
                <>
                  <Button
                    type="button"
                    className="brutal-btn-primary cursor-pointer"
                    disabled={saving}
                    onClick={() => void handleSave()}
                  >
                    {saving ? "Đang lưu…" : "Lưu"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="brutal-btn-outline cursor-pointer"
                    disabled={saving}
                    onClick={cancelEdit}
                  >
                    Hủy
                  </Button>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isEditing ? (
              <div className="brutal-card-flat space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pf-first">Tên</Label>
                    <Input
                      id="pf-first"
                      value={draftFirstName}
                      onChange={(e) => setDraftFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-last">Họ</Label>
                    <Input
                      id="pf-last"
                      value={draftLastName}
                      onChange={(e) => setDraftLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-phone">Số điện thoại</Label>
                  <Input
                    id="pf-phone"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="Tuỳ chọn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-avatar">URL ảnh đại diện</Label>
                  <Input
                    id="pf-avatar"
                    value={draftAvatarUrl}
                    onChange={(e) => setDraftAvatarUrl(e.target.value)}
                    placeholder="https://…"
                  />
                  <p className="text-xs text-slate-500">
                    Hoặc dán URL ảnh công khai. Chọn ảnh từ máy sẽ lưu ngay.
                  </p>
                </div>
                <CurrencySelectRow
                  value={draftCurrency}
                  disabled={saving}
                  onChange={setDraftCurrency}
                />
                <p className="text-xs text-slate-500">
                  Email và tên đăng nhập chỉ đọc — liên hệ hỗ trợ nếu cần đổi.
                </p>
              </div>
            ) : (
              <div className="brutal-info-panel px-4">
                <FieldRow label="Họ" value={data.lastName || "—"} />
                <FieldRow label="Tên" value={data.firstName || "—"} />
                <FieldRow label="Số điện thoại" value={data.phone ?? "—"} />
                <FieldRow label="Email" value={data.email} breakWords />
                <CurrencySelectRow
                  value={currencyValue}
                  disabled={currencySaving || saving}
                  onChange={(code) => void handleCurrencyChange(code)}
                />
                <FieldRow
                  label="Onboarding"
                  value={
                    data.isOnboardingCompleted
                      ? "Đã hoàn thành"
                      : "Chưa hoàn thành"
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectAvatar}
      />

      {isAvatarModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-[#0a0a0a] bg-white shadow-[4px_4px_0_0_#0a0a0a]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] px-4 py-3">
              <p className="text-sm font-extrabold">Ảnh đại diện</p>
              <button
                type="button"
                className="brutal-icon-btn h-8 w-8 p-0"
                onClick={() => setIsAvatarModalOpen(false)}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className="w-full cursor-pointer border-b-2 border-neutral-100 px-4 py-3 text-sm font-bold hover:bg-[#a8e087]/20"
              onClick={handleOpenFilePicker}
            >
              Chọn ảnh
            </button>
            <button
              type="button"
              className="w-full cursor-pointer px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setIsAvatarModalOpen(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
