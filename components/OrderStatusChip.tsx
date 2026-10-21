import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Preparing", className: "bg-warning/15 text-warning" },
  confirmed: { label: "Handed over", className: "bg-info/15 text-info" },
  completed: { label: "Completed", className: "bg-success/15 text-success" },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export function OrderStatusChip({ status }: { status: string }) {
  const s = MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}
