import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  size?: "sm" | "md" | "lg";
  imageUrl: string | null;
  className?: string;
};

const sizeMap = {
  sm: 40,
  md: 56,
  lg: 96,
} as const;

export function UserAvatar({ size = "md", imageUrl, className }: UserAvatarProps) {
  const px = sizeMap[size];
  const hasImage = Boolean(imageUrl?.trim());

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border-2 border-[#0a0a0a] bg-neutral-100",
        size === "lg" && "shadow-[3px_3px_0_0_#0a0a0a]",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {hasImage ? (
        <img
          src={imageUrl!}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#a8e087]/30">
          <User
            className={cn(
              "text-neutral-600",
              size === "sm" && "h-5 w-5",
              size === "md" && "h-7 w-7",
              size === "lg" && "h-10 w-10",
            )}
          />
        </div>
      )}
    </div>
  );
}
