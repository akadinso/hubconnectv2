import Link from "next/link";
import { cn } from "@/lib/utils";

// The first filter is the default and uses the plain path with no query string
export function FilterTabs({
  basePath,
  current,
  filters,
}: {
  basePath: string;
  current: string;
  filters: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f, i) => (
        <Link
          key={f.value}
          href={i === 0 ? basePath : `${basePath}?status=${f.value}`}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            current === f.value
              ? "border-foreground bg-foreground text-background"
              : "hover:bg-muted",
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
