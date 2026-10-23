"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createWeeklyPayouts,
  markPayoutPaid,
} from "@/app/admin/payouts/actions";

export function CreatePayoutsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await createWeeklyPayouts();
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(
            result.created
              ? `${result.created} payout(s) created`
              : "Nobody has anything to pay out",
          );
          router.refresh();
        })
      }
    >
      {pending ? "Working..." : "Create this week's payouts"}
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
