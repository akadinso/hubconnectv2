"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const PAY = [
  { value: "card", label: "Debit / Credit Card", icon: CreditCard },
  { value: "eft", label: "Instant EFT", icon: Banknote },
];

const DELIVERY = [
  { value: "campus", label: "Meet on campus", icon: MapPin },
  { value: "courier", label: "Courier delivery", icon: Truck },
];

const STEPS = [
  {
    title: "You pay HubConnect",
    text: "Card or Instant EFT. The money doesn't go to the seller yet.",
  },
  {
    title: "We hold it safely",
    text: "Your payment stays with HubConnect while you arrange the handover.",
  },
  {
    title: "Meet and check",
    text: "Meet on campus (or get your courier delivery) and check the item.",
  },
  {
    title: "Confirm to pay",
    text: "Confirm in My orders that you got it. That releases the seller's payment.",
  },
];

type Choice = { value: string; label: string; icon: React.ElementType };

function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Choice[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {legend}
      </legend>
      {options.map(({ value: v, label, icon: Icon }) => (
        <label
          key={v}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-muted p-3 text-sm has-[:checked]:border-primary"
        >
          <input
            type="radio"
            name={name}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            className="accent-primary"
          />
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

export function CheckoutShell({
  summary,
  demo,
  disabled,
  action,
}: {
  summary: React.ReactNode;
  demo: boolean;
  disabled?: boolean;
  action: (
    method: string,
    delivery: string,
  ) => Promise<{ error: string } | { redirectTo: string }>;
}) {
  const router = useRouter();
  const [method, setMethod] = React.useState("card");
  const [delivery, setDelivery] = React.useState("campus");
  const [loading, setLoading] = React.useState(false);

  async function handlePay() {
    setLoading(true);
    const result = await action(method, delivery);
    if ("error" in result) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    router.push(result.redirectTo);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        <ChoiceGroup
          legend="Payment method"
          name="method"
          options={PAY}
          value={method}
          onChange={setMethod}
        />
        <ChoiceGroup
          legend="How will you get it?"
          name="delivery"
          options={DELIVERY}
          value={delivery}
          onChange={setDelivery}
        />

        <div className="rounded-xl border border-gold/60 p-4">
          <p className="mb-3 text-sm font-semibold">How your payment works</p>
          <ol className="grid gap-3 sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="space-y-1">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-xs font-semibold">{s.title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-3 self-start">
        <div className="space-y-5 rounded-2xl bg-muted/60 p-6">
          {summary}
          <Button
            className="w-full py-6 text-base font-bold"
            onClick={handlePay}
            disabled={disabled || loading}
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </div>
        {demo && (
          <p className="text-center text-xs text-muted-foreground">
            Test mode: no real money is taken
          </p>
        )}
      </div>
    </div>
  );
}
