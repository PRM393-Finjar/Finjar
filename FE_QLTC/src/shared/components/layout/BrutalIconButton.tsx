import { cn } from "@/lib/utils";

type BrutalIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  badge?: boolean;
};

export function BrutalIconButton({
  children,
  badge,
  className,
  type = "button",
  ...props
}: BrutalIconButtonProps) {
  return (
    <button
      type={type}
      className={cn("brutal-icon-btn relative cursor-pointer", className)}
      {...props}
    >
      {children}
      {badge ? (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-[#0a0a0a] bg-red-500" />
      ) : null}
    </button>
  );
}
