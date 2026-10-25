"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Tag } from "lucide-react";
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

type OfferListing = {
  id: string;
  title: string;
  price: number | null;
  image: string | null;
};

export function OfferDialog({
  role,
  conversationId,
  listings,
  defaultListingId,
  defaultOpen = false,
}: {
  role: "buyer" | "seller";
  conversationId: string;
  listings: OfferListing[];
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make an offer</DialogTitle>
          <DialogDescription>
            {isBuyer
              ? "Pick the item and suggest a price. The seller can accept or decline in the chat."
              : "Pick the listing and agree a price with the buyer. They can accept or decline in the chat."}
          </DialogDescription>
        </DialogHeader>

        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isBuyer
              ? "This seller has no active listings right now."
              : "You need an active listing to send an offer."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">
                {isBuyer ? "Which item?" : "Which listing?"}
              </legend>

              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {listings.map((l) => {
                  const selected = l.id === listingId;
                  return (
                    <label
                      key={l.id}
                      className="relative cursor-pointer overflow-hidden rounded-xl border bg-card transition has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                    >
                      <input
                        type="radio"
                        name="offer-listing"
                        value={l.id}
                        checked={selected}
                        onChange={() => setListingId(l.id)}
                        className="sr-only"
                      />
                      <div className="relative aspect-square bg-muted">
                        {l.image && (
                          <Image
                            src={l.image}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-cover"
                          />
                        )}
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 p-2">
                        <p className="truncate text-xs font-medium">
                          {l.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {l.price != null ? rand(l.price) : "No price"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

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
              {listing?.price != null && (
                <p className="text-xs text-muted-foreground">
                  Listed price: {rand(listing.price)}
                </p>
              )}
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
