"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { startCheckout } from "@/app/(main)/checkout/actions";

const METHODS = [
  {
    value: "card",
    label: "Card",
    hint: "Visa or Mastercard",
    icon: CreditCard,
  },
  {
    value: "eft",
    label: "Instant EFT",
    hint: "Pay from your bank app",
    icon: Banknote,
  },
];

export function PaymentPanel({
  total,
  disabled,
  demo,
}: {
  total: number;
  disabled?: boolean;
  demo: boolean;
}) {
  const router = useRouter();
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    const result = await startCheckout(method);

    if ("error" in result) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    router.push(result.redirectTo);
  }

  return (
    <div className="space-y-4">
      {demo && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          Demo mode: no real money moves.
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Pay with</legend>
        {METHODS.map(({ value, label, hint, icon: Icon }) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 has-[:checked]:border-foreground"
          >
            <input
              type="radio"
              name="method"
              value={value}
              checked={method === value}
              onChange={() => setMethod(value)}
              className="accent-foreground"
            />
            <Icon className="size-5" />
            <span className="text-sm">
              <span className="font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">
                {hint}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex items-start gap-3 rounded-xl bg-muted p-3 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <p className="text-muted-foreground">
          Your payment is held safely by HubConnect. The seller only gets paid
          after you confirm you received your item.
        </p>
      </div>

      <Button
        className="w-full py-5 font-bold"
        onClick={handlePay}
        disabled={disabled || loading}
      >
        {loading ? "Processing..." : `Pay R${total.toFixed(2)}`}
      </Button>
    </div>
  );
}
