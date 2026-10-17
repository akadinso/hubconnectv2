import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  dismissed: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", STYLES[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}
