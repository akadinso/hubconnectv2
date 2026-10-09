"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore, type ListingSummary } from "./StoreProvider";

export function ListingActions({ listing }: { listing: ListingSummary }) {
  const { addToCart, toggleFavourite, isFavourite } = useStore();
  const favourited = isFavourite(listing.id);

  return (
    <div className="flex gap-3">
      <Button className="flex-1" onClick={() => addToCart(listing)}>
        <ShoppingCart />
        Add to cart
      </Button>
      <Button
        variant="outline"
        aria-pressed={favourited}
        aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
        onClick={() => toggleFavourite(listing)}
      >
        <Heart className={cn(favourited && "fill-red-500 text-red-500")} />
      </Button>
    </div>
  );
}
