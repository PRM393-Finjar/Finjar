import { useState } from "react";
import { Bot, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { AiChatContent } from "./AiChatContent";

export function AiChatFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "brutal-btn-primary fixed z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8e087] focus-visible:ring-offset-2",
          "bottom-24 right-4 md:bottom-6 md:right-6",
        )}
        aria-label="Mở trò chuyện AI"
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={false}
          overlayClassName="z-50 bg-slate-900/20 backdrop-blur-[2px]"
          className={cn(
            "brutal-card flex max-h-[min(720px,92vh)] w-[min(100vw-1.5rem,400px)] max-w-[min(100vw-1.5rem,400px)] flex-col gap-0 overflow-hidden border-0 p-0 shadow-none",
            "!left-auto !right-4 !top-auto !bottom-24 !translate-x-0 !translate-y-0 md:!bottom-6 md:!right-6",
            "bg-white",
            "data-[state=open]:animate-in data-[state=closed]:animate-out sm:rounded-2xl",
          )}
        >
          <DialogDescription className="sr-only">
            Cửa sổ chat trợ lý AI FinJar.
          </DialogDescription>

          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-linear-to-r bg-[#0a0a0a] px-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-white backdrop-blur-sm">
                  <Bot className="h-5 w-5" strokeWidth={2} aria-hidden />
                </div>
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-neutral-900 bg-emerald-400"
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-[15px] font-semibold leading-tight text-white">
                  Trợ lý FinJar
                </DialogTitle>
                <p className="truncate text-xs text-white/85">Chat với API</p>
              </div>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Đóng"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </DialogClose>
          </header>

          <AiChatContent className="flex min-h-0 flex-1 flex-col" />
        </DialogContent>
      </Dialog>
    </>
  );
}
