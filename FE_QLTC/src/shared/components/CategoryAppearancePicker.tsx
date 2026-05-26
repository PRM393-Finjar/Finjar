import { cn } from "@/lib/utils";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  isValidHexColor,
} from "@/shared/components/categoryAppearance";

type CategoryAppearancePickerProps = {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  iconError?: string;
  colorError?: string;
};

export function CategoryAppearancePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  iconError,
  colorError,
}: CategoryAppearancePickerProps) {
  const previewColor = isValidHexColor(color) ? color : "#a8e087";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-bold text-neutral-900">Icon</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onIconChange(opt.id)}
              className={cn(
                "cursor-pointer rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition hover:translate-x-[-1px] hover:translate-y-[-1px]",
                icon === opt.id
                  ? "border-[#0a0a0a] bg-[#a8e087] text-[#0a0a0a] shadow-[2px_2px_0_0_#0a0a0a]"
                  : "border-[#0a0a0a] bg-white text-neutral-800 shadow-[2px_2px_0_0_#0a0a0a] hover:shadow-[3px_3px_0_0_#0a0a0a]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {iconError ? <p className="text-sm text-red-600">{iconError}</p> : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-neutral-900">Màu</p>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_COLOR_OPTIONS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Màu ${swatch}`}
              onClick={() => onColorChange(swatch)}
              className={cn(
                "h-9 w-9 cursor-pointer rounded-full border-2 transition hover:scale-105",
                color === swatch
                  ? "border-[#0a0a0a] ring-2 ring-[#0a0a0a] ring-offset-2"
                  : "border-[#0a0a0a]",
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
          <div className="brutal-row ml-1 flex items-center gap-2 px-3 py-1.5">
            <span
              className="inline-block h-6 w-6 rounded-full border-2 border-[#0a0a0a]"
              style={{ backgroundColor: previewColor }}
            />
            <span className="font-mono text-xs font-medium text-neutral-700">
              {color || "—"}
            </span>
          </div>
        </div>
        {colorError ? <p className="text-sm text-red-600">{colorError}</p> : null}
      </div>
    </div>
  );
}
