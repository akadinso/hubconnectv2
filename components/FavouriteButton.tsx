"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, type ListingSummary } from "./StoreProvider";

export function FavouriteButton({
  listing,
  className,
}: {
  listing: ListingSummary;
  className?: string;
}) {
  const { isFavourite, toggleFavourite } = useStore();
  const active = isFavourite(listing.id);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={active}
      onClick={() => toggleFavourite(listing)}
      className={cn(
        "absolute right-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur transition hover:bg-background",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-red-500 text-red-500")} />
    </button>
  );
}
