import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useAdminAiSettingsQuery,
  useUpdateAdminAiSettingsMutation,
} from "../hooks/useAdminAiSettings";

const adminTitle = "text-[#4F46E5]";
const adminBtnPrimary =
  "bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5] focus-visible:ring-[#6366F1]";
const adminFocusField =
  "focus-visible:border-[#6366F1]/50 focus-visible:ring-[#6366F1]/30";

export function AdminAiSettingsPage() {
  const { data, isLoading, isError, isFetching } = useAdminAiSettingsQuery();
  const updateMutation = useUpdateAdminAiSettingsMutation();

  const [modelName, setModelName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isEnabled, setIsEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (!data) return;
    // Đồng bộ form khi GET thành công / sau invalidate.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate form from query
    setModelName(data.modelName);
    setSystemPrompt(data.systemPrompt);
    setTemperature(Number(data.temperature));
    setMaxTokens(data.maxTokens);
    setIsEnabled(data.isEnabled);
    setApiKey("");
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateMutation.mutateAsync({
      modelName: modelName.trim(),
      systemPrompt: systemPrompt.trim(),
      temperature,
      maxTokens: Math.floor(maxTokens),
      isEnabled,
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    });
    setApiKey("");
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Đang tải cấu hình AI…</p>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Không tải được cấu hình AI.</p>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", adminTitle)}>
          Cài đặt AI
        </h1>
        <p className="text-sm text-slate-600">
          Mô hình, system prompt, nhiệt độ, token và bật/tắt —{" "}
          <code className="text-xs">GET/PATCH /api/v1/admin/ai-settings</code>.
          {isFetching ? (
            <span className="text-[#6366F1]"> · Đang làm mới…</span>
          ) : null}
        </p>
      </div>

      <Card className="border-slate-200/90 shadow-sm ring-1 ring-[#6366F1]/10">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#6366F1]" aria-hidden />
            <CardTitle className={cn("text-lg font-semibold", adminTitle)}>
              Trợ lý AI (FinJar)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-100/90 bg-indigo-50/50 px-3 py-2.5">
              <input
                id="ai-enabled"
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="size-4 rounded border-input text-[#6366F1] focus-visible:ring-2 focus-visible:ring-[#6366F1]/30"
              />
              <Label htmlFor="ai-enabled" className="cursor-pointer font-medium">
                Bật tính năng chat AI cho người dùng
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-model">Model</Label>
              <Input
                id="ai-model"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className={cn("h-10", adminFocusField)}
                placeholder="gemini-1.5-flash-lite"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-prompt">System prompt</Label>
              <textarea
                id="ai-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                required
                className={cn(
                  "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none",
                  adminFocusField,
                )}
                placeholder="Hướng dẫn hành vi cho AI…"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ai-temp">Temperature (0–2)</Label>
                <Input
                  id="ai-temp"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className={cn("h-10", adminFocusField)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-max-tokens">Max tokens</Label>
                <Input
                  id="ai-max-tokens"
                  type="number"
                  min={1}
                  step={1}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className={cn("h-10", adminFocusField)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-api-key">API key (Google AI)</Label>
              <Input
                id="ai-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={cn("h-10", adminFocusField)}
                placeholder="Để trống nếu không đổi"
              />
              <p className="text-[11px] text-muted-foreground">
                Đang hiển thị dạng che:{" "}
                <span className="font-mono text-slate-700">
                  {data.apiKeyMasked ?? "—"}
                </span>
              </p>
            </div>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className={cn(adminBtnPrimary)}
            >
              {updateMutation.isPending ? "Đang lưu…" : "Lưu cấu hình"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
