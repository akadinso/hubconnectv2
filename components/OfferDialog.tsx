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
import { sendOffer } from "@/app/(main)/messages/actions";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function OfferDialog({
  conversationId,
  listings,
  defaultListingId,
}: {
  conversationId: string;
  listings: { id: string; title: string }[];
  defaultListingId: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [listingId, setListingId] = React.useState(
    defaultListingId && listings.some((l) => l.id === defaultListingId)
      ? defaultListingId
      : (listings[0]?.id ?? ""),
  );
  const [price, setPrice] = React.useState("");
  const [pending, startTransition] = React.useTransition();

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
            size="icon"
            aria-label="Make an offer"
          >
            <Tag className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Make an offer</DialogTitle>
          <DialogDescription>
            Agree a price with the buyer. They can accept or decline in the
            chat.
          </DialogDescription>
        </DialogHeader>

        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need an active listing to send an offer.
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-price">Agreed price (R)</Label>
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

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending..." : "Send offer"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
