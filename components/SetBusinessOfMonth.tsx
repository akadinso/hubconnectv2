"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setBusinessOfMonth } from "@/app/admin/leaderboard/actions";

export function SetBusinessOfMonth({
  month,
  sellerId,
  isCurrent,
}: {
  month: string;
  sellerId: string;
  isCurrent: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick() {
    const blurb = window.prompt(
      "One line for the home page spotlight (optional):",
    );
    if (blurb === null) return; // cancelled

    startTransition(async () => {
      const result = await setBusinessOfMonth(month, sellerId, blurb);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Business of the Month set");
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant={isCurrent ? "secondary" : "outline"}
      disabled={pending}
      onClick={pick}
    >
      {isCurrent ? "Current spotlight" : "Spotlight"}
    </Button>
  );
}
