import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/types/listing";

const VARIANTS = {
  // "Recommended for you": smaller cards, more visible at once
  compact: "basis-[45%] sm:basis-1/3 lg:basis-1/5",
  // "All Listings": larger cards
  large: "basis-[70%] sm:basis-1/2 lg:basis-1/4",
};

type CarouselComponentProps = {
  listings: Listing[];
  title?: string;
  icon?: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
};

export function CarouselComponent({
  listings,
  title,
  icon,
  variant = "large",
  className,
}: CarouselComponentProps) {
  return (
    <section className={cn("w-full min-w-0 space-y-4", className)}>
      {title && (
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </h2>
      )}

      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listings yet.</p>
      ) : (
        <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {listings.map((listing) => (
              <CarouselItem
                key={listing.id}
                className={cn("pl-4", VARIANTS[variant])}
              >
                <ListingCard listing={listing} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </section>
  );
}
