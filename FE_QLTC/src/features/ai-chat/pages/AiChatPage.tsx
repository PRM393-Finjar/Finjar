import { BrutalPageHeader } from "@/shared/components/layout/BrutalPageHeader";
import { AiChatContent } from "../components/AiChatContent";

export function AiChatPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <BrutalPageHeader
        title="Trợ lý AI"
        description={
          <>
            Trò chuyện tư vấn tài chính (API{" "}
            <code className="text-xs">POST /api/v1/ai/chat</code>).
          </>
        }
      />
      <div className="brutal-card overflow-hidden border-0 shadow-none">
        <AiChatContent className="flex min-h-[480px] flex-col" />
      </div>
    </section>
  );
}
