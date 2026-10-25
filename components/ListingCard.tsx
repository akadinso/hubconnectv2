import Link from "next/link";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FavouriteButton } from "@/components/FavouriteButton";
import { rand } from "@/lib/format";
import type { Listing } from "@/types/listing";

export function ListingCard({ listing }: { listing: Listing }) {
  const { rating, reviewCount } = listing;
  const seller = listing.seller;

  return (
    <div className="group relative min-w-0">
      <FavouriteButton
        className="z-10"
        listing={{
          id: listing.id,
          title: listing.title,
          price: listing.price ?? null,
          image: listing.image ?? null,
        }}
      />

      <Link href={`/listings/${listing.id}`} className="block space-y-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {listing.image && (
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{listing.title}</p>
          {listing.price != null && listing.price > 0 && (
            <p className="text-sm font-bold text-primary">
              {rand(listing.price)}
            </p>
          )}
          {listing.campus && (
            <p className="truncate text-[11px] text-muted-foreground">
              {listing.campus}
            </p>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          {seller && (
            <>
          <Avatar className="size-5 shrink-0 sm:size-6">
            {seller.avatarUrl && (
              <AvatarImage src={seller.avatarUrl} alt={seller.name} />
            )}
            <AvatarFallback className="text-[9px] sm:text-[10px]">
              {seller.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {seller.name}
          </span>

          {seller.verified && (
            <BadgeCheck className="size-3.5 shrink-0 text-primary sm:size-4" />
          )}

          {seller.isNew && (
            <Badge
              variant="secondary"
              className="hidden shrink-0 text-[10px] sm:inline-flex"
            >
              New Seller
            </Badge>
          )}
            </>
          )}

          {rating != null && (
            <span className="ml-auto shrink-0 text-xs">
              {rating.toFixed(1)}
              {reviewCount ? ` (${reviewCount})` : ""}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
