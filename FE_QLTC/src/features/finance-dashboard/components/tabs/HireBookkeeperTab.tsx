import { useState } from "react";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookkeepers } from "../../mockData";
import { useFinanceDashboard } from "../../context/FinanceDashboardContext";
import { SectionCard } from "../shared";

export function HireBookkeeperTab() {
  const { tr } = useFinanceDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const handleBook = () => {
    if (!selectedId) return;
    setBooked(true);
  };

  if (booked) {
    const bk = bookkeepers.find((b) => b.id === selectedId);
    return (
      <SectionCard className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="mt-4 text-lg font-bold">{tr("consultationBooked")}</h2>
        <p className="mt-2 text-sm text-neutral-500">
          {bk?.name} {tr("contactWithin24h")}
        </p>
        <button
          type="button"
          onClick={() => {
            setBooked(false);
            setSelectedId(null);
          }}
          className="mt-6 rounded-full border border-neutral-200 px-5 py-2 text-sm font-medium dark:border-neutral-700"
        >
          {tr("bookAnother")}
        </button>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{tr("hireBookkeeper")}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {tr("hireDesc")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {bookkeepers.map((bk) => (
          <SectionCard
            key={bk.id}
            className={cn(
              "cursor-pointer transition ring-2 ring-transparent",
              selectedId === bk.id && "ring-neutral-900 dark:ring-white",
              !bk.available && "opacity-60",
            )}
            onClick={() => bk.available && setSelectedId(bk.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-lg font-bold dark:bg-neutral-700">
                {bk.name.charAt(0)}
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  bk.available
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800",
                )}
              >
                {bk.available ? tr("available") : tr("busy")}
              </span>
            </div>
            <h3 className="mt-3 font-semibold">{bk.name}</h3>
            <p className="text-sm text-neutral-500">{bk.specialty}</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{bk.rating}</span>
              <span className="text-neutral-400">
                ({bk.reviews} {tr("reviews")})
              </span>
            </div>
            <p className="mt-3 text-lg font-bold">{bk.rate}</p>
          </SectionCard>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!selectedId}
          onClick={handleBook}
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {tr("bookConsultation")}
        </button>
      </div>
    </div>
  );
}
