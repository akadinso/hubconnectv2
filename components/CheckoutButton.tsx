"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/app/(main)/checkout/actions";
export function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await startCheckout();

    if ("error" in result) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    // PayFast needs a real form POST, so build one and submit it
    const form = document.createElement("form");
    form.method = "POST";
    form.action = result.action;
    for (const [name, value] of Object.entries(result.fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <Button
      className="w-full py-5 font-bold"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? "Redirecting to PayFast..." : "Pay with PayFast"}
    </Button>
  );
}
