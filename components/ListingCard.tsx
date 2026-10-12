import Link from "next/link";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/types/listing";

export function ListingCard({ listing }: { listing: Listing }) {
  const seller = listing.seller ?? {
    name: "Unknown Seller",
    avatarUrl: null,
    verified: false,
    isNew: false,
  };

  const sellerInitials = (seller.name || "US")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const imageUrl = listing.image ?? listing.image_url ?? null;

  const formattedPrice =
    typeof listing.price === "number"
      ? new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: "ZAR",
          maximumFractionDigits: 0,
        }).format(listing.price)
      : null;

  return (
    <Link href={`/listings/${listing.id}`} className="group block space-y-2.5">
      {/* Image & Type Overlay */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title ?? "Listing image"}
            fill
            sizes="(min-width: 1024px) 25vw, 60vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}

        {listing.type && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-background/80 text-[10px] capitalize backdrop-blur-md"
          >
            {listing.type}
          </Badge>
        )}
      </div>

      {/* Title & Price Header Row */}
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold transition-colors group-hover:text-gold">
            {listing.title}
          </p>
          {formattedPrice && (
            <span className="shrink-0 text-sm font-bold text-navy-blue">
              {formattedPrice}
            </span>
          )}
        </div>
        {listing.subtitle && (
          <p className="truncate text-xs text-muted-foreground">
            {listing.subtitle}
          </p>
        )}
      </div>

      {/* Seller & Rating Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="size-5 shrink-0">
            {seller.avatarUrl && (
              <AvatarImage src={seller.avatarUrl} alt={seller.name} />
            )}
            <AvatarFallback className="text-[9px]">
              {sellerInitials}
            </AvatarFallback>
          </Avatar>

          <span className="truncate text-xs font-medium">{seller.name}</span>

          {seller.verified && (
            <BadgeCheck className="size-3.5 shrink-0 text-primary" />
          )}
        </div>

        {listing.rating != null && (
          <span className="shrink-0 font-mono text-[11px] text-foreground">
            ★ {listing.rating.toFixed(1)}
            {listing.reviewCount ? ` (${listing.reviewCount})` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
