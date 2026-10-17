import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Paid", "Handed over", "Received"];
const DONE: Record<string, number> = {
  pending: 1,
  confirmed: 2,
  completed: 3,
  cancelled: 0,
};

export function EscrowSteps({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="text-xs text-muted-foreground">
        Cancelled. The buyer was refunded.
      </p>
    );
  }
  const done = DONE[status] ?? 0;

  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border",
              i < done
                ? "border-success bg-success text-success-foreground"
                : "text-muted-foreground",
            )}
          >
            {i < done ? <Check className="size-3" /> : i + 1}
          </span>
          <span className={i < done ? "font-medium" : "text-muted-foreground"}>
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
        </li>
      ))}
    </ol>
  );
}
