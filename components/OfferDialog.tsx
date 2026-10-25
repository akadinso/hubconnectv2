"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { rand } from "@/lib/format";
import { sendBuyerOffer, sendOffer } from "@/app/(main)/messages/actions";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function OfferDialog({
  role,
  conversationId,
  listings,
  defaultListingId,
  defaultOpen = false,
}: {
  role: "buyer" | "seller";
  conversationId: string;
  listings: { id: string; title: string; price: number | null }[];
  defaultListingId: string | null;
  defaultOpen?: boolean;
}) {
  const isBuyer = role === "buyer";
  const [open, setOpen] = React.useState(defaultOpen);
  const [listingId, setListingId] = React.useState(
    defaultListingId && listings.some((l) => l.id === defaultListingId)
      ? defaultListingId
      : (listings[0]?.id ?? ""),
  );
  const [price, setPrice] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const listing = listings.find((l) => l.id === listingId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid price.");
      return;
    }
    if (isBuyer && listing?.price != null && amount >= listing.price) {
      setError(
        `Offer less than the listed price (${rand(listing.price)}), or check out at the listed price.`,
      );
      return;
    }

    startTransition(async () => {
      const result = isBuyer
        ? await sendBuyerOffer(conversationId, listingId, amount)
        : await sendOffer(conversationId, listingId, amount);

      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Offer sent");
      setPrice("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1"
          >
            <Tag className="size-4" />
            Offer
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Make an offer</DialogTitle>
          <DialogDescription>
            {isBuyer
              ? "Suggest a price. The seller can accept or decline in the chat."
              : "Agree a price with the buyer. They can accept or decline in the chat."}
          </DialogDescription>
        </DialogHeader>

        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isBuyer
              ? "This seller has no active listings right now."
              : "You need an active listing to send an offer."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-listing">Listing</Label>
              <select
                id="offer-listing"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className={selectClass}
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
              {listing?.price != null && (
                <p className="text-xs text-muted-foreground">
                  Listed price: {rand(listing.price)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-price">
                {isBuyer ? "Your offer (R)" : "Agreed price (R)"}
              </Label>
              <Input
                id="offer-price"
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending..." : "Send offer"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
