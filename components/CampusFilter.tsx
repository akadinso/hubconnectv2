"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CampusFilter({
  campuses,
  value,
  mine,
}: {
  campuses: { slug: string; name: string }[];
  value: string;
  mine?: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // Keeps the search term and the product/service filter
    const next = new URLSearchParams(params.toString());
    if (e.target.value) next.set("campus", e.target.value);
    else next.delete("campus");

    const qs = next.toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Campus</span>
      <select
        value={value}
        onChange={onChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <option value="">All campuses</option>
        {campuses.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
            {c.slug === mine ? " (your campus)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
