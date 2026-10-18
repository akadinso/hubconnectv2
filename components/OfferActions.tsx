"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  declineOffer,
  sendOffer,
  withdrawOffer,
} from "@/app/(main)/messages/actions";

const selectClass =
  "h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function SendOfferForm({
  conversationId,
  listings,
  defaultListingId,
}: {
  conversationId: string;
  listings: { id: string; title: string; price: number | null }[];
  defaultListingId: string | null;
}) {
  const router = useRouter();
  const [listingId, setListingId] = React.useState(
    defaultListingId && listings.some((l) => l.id === defaultListingId)
      ? defaultListingId
      : (listings[0]?.id ?? ""),
  );
  const [price, setPrice] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (listings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You need an active listing to send an offer.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendOffer(conversationId, listingId, Number(price));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Offer sent");
      setPrice("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select
        value={listingId}
        onChange={(e) => setListingId(e.target.value)}
        className={selectClass}
        aria-label="Listing"
      >
        {listings.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
      </select>
      <Input
        type="number"
        inputMode="decimal"
        min="1"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Agreed price (R)"
        className="w-40"
        required
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending..." : "Send offer"}
      </Button>
    </form>
  );
}

export function OfferButtons({
  offerId,
  conversationId,
  role,
}: {
  offerId: string;
  conversationId: string;
  role: "buyer" | "seller";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run() {
    startTransition(async () => {
      const result =
        role === "buyer"
          ? await declineOffer(offerId, conversationId)
          : await withdrawOffer(offerId, conversationId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={run}>
      {role === "buyer" ? "Decline" : "Withdraw offer"}
    </Button>
  );
}
