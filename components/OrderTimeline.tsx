import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  title: string;
  text: string;
  done: boolean;
  current?: boolean;
  date?: string | null;
};

export function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                s.done
                  ? "border-success bg-success text-success-foreground"
                  : s.current
                    ? "border-primary text-primary ring-2 ring-primary/20"
                    : "text-muted-foreground",
              )}
            >
              {s.done ? <Check className="size-3.5" /> : i + 1}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "my-1 w-px flex-1",
                  s.done ? "bg-success" : "bg-border",
                )}
              />
            )}
          </div>

          <div className="min-w-0 pb-6">
            <p
              className={cn(
                "text-sm font-semibold",
                !s.done && !s.current && "text-muted-foreground",
              )}
            >
              {s.title}
            </p>
            <p className="text-xs text-muted-foreground">{s.text}</p>
            {s.date && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {s.date}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
