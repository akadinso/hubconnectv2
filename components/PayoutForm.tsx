"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPayout } from "@/app/(main)/orders/actions";

export function PayoutForm({ available }: { available: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    available > 0 ? available.toFixed(2) : "",
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestPayout(Number(amount));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Payout requested. We'll process it shortly.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        inputMode="decimal"
        min="1"
        step="0.01"
        max={available}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-36"
        aria-label="Payout amount in rand"
        disabled={available <= 0}
      />
      <Button type="submit" disabled={pending || available <= 0}>
        {pending ? "Requesting..." : "Payout to bank account"}
      </Button>
    </form>
  );
}
