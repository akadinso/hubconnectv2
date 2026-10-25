"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createWeeklyPayouts,
  markPayoutPaid,
} from "@/app/admin/payouts/actions";

export function CreatePayoutsButton({
  weekStart,
  disabled,
}: {
  weekStart: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending || disabled}
      onClick={() =>
        startTransition(async () => {
          const result = await createWeeklyPayouts(weekStart);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(
            result.created
              ? `${result.created} payout(s) created`
              : "Nothing new to pay out for this week",
          );
          router.refresh();
        })
      }
    >
      {pending ? "Working..." : "Create payouts for this week"}
    </Button>
  );
}

export function MarkPaidButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markPayoutPaid(id);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Marked as paid");
          router.refresh();
        })
      }
    >
      Mark paid
    </Button>
  );
}
