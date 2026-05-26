import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, CircleUserRound, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiChatService, type AiChatMessage } from "../services";

type Bubble = {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
};

const welcomeMessage =
  "Chào bạn! Hỏi mình về ngân sách, phân loại chi tiêu hoặc mẹo tiết kiệm.";

const toRecentMessages = (turns: Bubble[]): AiChatMessage[] =>
  turns
    .filter((bubble) => bubble.id !== "welcome")
    .map((bubble) => ({
      sender: bubble.role === "user" ? "User" : "AI",
      content: bubble.text,
    }));

export function AiChatContent({ className }: { className?: string }) {
  const [turns, setTurns] = useState<Bubble[]>([
    {
      id: "welcome",
      role: "assistant",
      text: welcomeMessage,
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextBubbleIdRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  const send = async (message?: string) => {
    const text = (message ?? input).trim();
    if (!text || pending) return;

    setError(null);
    setSuggestions([]);

    const userBubble: Bubble = {
      id: `u-${(nextBubbleIdRef.current += 1)}`,
      role: "user",
      text,
    };

    setTurns((prev) => [...prev, userBubble]);
    setInput("");
    setPending(true);

    const recent = toRecentMessages(turns);

    try {
      const res = await aiChatService.send(
        text,
        recent.length > 0 ? recent : undefined,
      );
      const answer = res.answer?.trim() || "Không có phản hồi.";
      const nextSuggestions =
        res.suggestions?.filter((item) => item.trim().length > 0) ?? [];

      setTurns((prev) => [
        ...prev,
        {
          id: `a-${(nextBubbleIdRef.current += 1)}`,
          role: "assistant",
          text: answer,
          source: res.source,
        },
      ]);
      setSuggestions(nextSuggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi tin nhắn thất bại.");
      setTurns((prev) => [
        ...prev,
        {
          id: `a-${(nextBubbleIdRef.current += 1)}`,
          role: "assistant",
          text: "Đã có lỗi khi gọi API. Kiểm tra mạng hoặc cấu hình AI trên server.",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send();
  };

  return (
    <div
      className={cn(
        "bg-linear-to-b from-neutral-100 to-white text-slate-800",
        className,
      )}
    >
      <div
        ref={listRef}
        className="scrollbar-none max-h-[min(520px,65vh)] min-h-[280px] flex-1 overflow-y-auto px-3 py-3"
      >
        <div className="flex flex-col gap-3">
          {turns.map((bubble) => {
            const isUser = bubble.role === "user";
            const avatar = (
              <div
                className={cn(
                  "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isUser
                    ? "bg-[#a8e087] ring-2 ring-neutral-900"
                    : "bg-linear-to-br bg-neutral-200 ring-2 ring-neutral-900",
                )}
                aria-hidden
              >
                {isUser ? (
                  <CircleUserRound
                    className="h-[18px] w-[18px] text-neutral-900"
                    strokeWidth={2}
                  />
                ) : (
                  <Bot
                    className="h-[18px] w-[18px] text-white drop-shadow-sm"
                    strokeWidth={2}
                  />
                )}
              </div>
            );

            const body = (
              <div
                className={cn(
                  "flex min-w-0 max-w-[min(100%,20rem)] flex-col",
                  isUser ? "items-end" : "items-start",
                )}
              >
                <p
                  className={cn(
                    "mb-1 text-xs font-medium",
                    isUser ? "text-neutral-900" : "text-slate-500",
                  )}
                >
                  {isUser ? "Bạn" : "Trợ lý FinJar"}
                </p>
                <div
                  className={cn(
                    "w-fit max-w-full whitespace-pre-wrap rounded-2xl px-3 py-2 text-[15px] leading-snug shadow-sm",
                    isUser
                      ? "rounded-tr-sm bg-[#a8e087] text-[#0a0a0a]"
                      : "rounded-tl-sm border border-neutral-200 bg-white text-slate-800",
                  )}
                >
                  {bubble.text}
                </div>
                {!isUser && bubble.source ? (
                  <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Source: {bubble.source}
                  </span>
                ) : null}
              </div>
            );

            return (
              <div
                key={bubble.id}
                className={cn(
                  "flex w-full gap-2",
                  isUser ? "justify-end" : "justify-start",
                )}
              >
                {isUser ? (
                  <>
                    {body}
                    {avatar}
                  </>
                ) : (
                  <>
                    {avatar}
                    {body}
                  </>
                )}
              </div>
            );
          })}

          {pending ? (
            <p className="text-xs text-slate-500">Đang trả lời...</p>
          ) : null}
          {error ? (
            <p className="text-xs font-medium text-amber-700">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-200 bg-white/90 px-2 pb-3 pt-2 backdrop-blur-sm">
        {suggestions.length > 0 ? (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                disabled={pending}
                className="brutal-pill shrink-0 px-3 py-1.5 text-xs font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Nhập câu hỏi..."
            disabled={pending}
            className="brutal-search max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-white px-4 py-2 text-[15px] leading-6 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#a8e087] disabled:opacity-60"
            aria-label="Nhập tin nhắn"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="brutal-btn-primary mb-0.5 inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden />
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
