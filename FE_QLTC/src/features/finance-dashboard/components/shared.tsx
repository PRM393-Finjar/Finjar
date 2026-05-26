import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

export function LegendDot({
  color,
  outline,
}: {
  color: string;
  outline?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#0a0a0a]",
        outline ? "bg-transparent" : color,
      )}
      style={outline ? { borderColor: "#0a0a0a", background: "transparent" } : undefined}
    />
  );
}

export function DropdownPill({
  value,
  onValueChange,
  options,
  getLabel,
  className,
}: {
  value: string;
  onValueChange?: (v: string) => void;
  options: readonly string[];
  getLabel?: (value: string) => string;
  className?: string;
}) {
  const label = (opt: string) => getLabel?.(opt) ?? opt;
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "brutal-pill h-9 w-auto gap-1 px-4 text-sm font-semibold shadow-none focus:ring-2 focus:ring-[#a8e087]",
          className,
        )}
      >
        <SelectValue>{label(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="border-2 border-[#0a0a0a]">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {label(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SectionCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "brutal-card p-5 text-left",
        onClick && "cursor-pointer transition hover:translate-x-[-1px] hover:translate-y-[-1px]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

const REPORT_LINKS = [
  { label: "Giao dịch", to: ROUTES.TRANSACTIONS },
  { label: "Ngân sách", to: ROUTES.BUDGET },
  { label: "Danh mục chi", to: ROUTES.CATEGORIES },
] as const;

export function ViewReportButton({ label = "Xem báo cáo" }: { label?: string }) {
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="brutal-pill inline-flex h-9 cursor-pointer items-center gap-1 px-4 text-sm font-semibold"
        >
          {label}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 border-2 border-[#0a0a0a] p-2">
        <p className="mb-2 px-2 text-xs font-bold text-neutral-600">Mở báo cáo</p>
        <ul className="space-y-1">
          {REPORT_LINKS.map((item) => (
            <li key={item.to}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-[#a8e087]/40"
                onClick={() => navigate(item.to)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
