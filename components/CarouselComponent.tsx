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
  if (!listings || listings.length === 0) {
    return (
      <section className={cn("w-full min-w-0 space-y-2", className)}>
        {title && (
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {icon}
            {title}
          </h2>
        )}
        <p className="text-sm text-muted-foreground">No listings yet.</p>
      </section>
    );
  }

  return (
    <section className={cn("w-full min-w-0 space-y-4", className)}>
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        {/* Header with Title & Next/Prev Controls */}
        <div className="flex items-center justify-between pb-1">
          {title ? (
            <h2 className="flex items-center gap-2 text-base font-semibold">
              {icon}
              {title}
            </h2>
          ) : (
            <div />
          )}

          {/* Navigation controls positioned static in header */}
          <div className="hidden sm:flex items-center gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0 h-8 w-8" />
            <CarouselNext className="static translate-x-0 translate-y-0 h-8 w-8" />
          </div>
        </div>

        <CarouselContent className="-ml-4 pt-1">
          {listings.map((listing, index) => (
            <CarouselItem
              key={listing.id ? `${listing.id}-${index}` : index}
              className={cn("pl-4", VARIANTS[variant])}
            >
              <ListingCard listing={listing} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
