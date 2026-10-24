"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORTS } from "@/lib/marketplace-filters";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    if (e.target.value === "newest") next.delete("sort");
    else next.set("sort", e.target.value);

    const qs = next.toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <select
        value={value}
        onChange={onChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
