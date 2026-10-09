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

  return (
    <Link href={`/listings/${listing.id}`} className="group block space-y-2">
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
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{listing.title}</p>
        {listing.subtitle && (
          <p className="truncate text-xs text-muted-foreground">
            {listing.subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Avatar className="size-6">
          {seller.avatarUrl && (
            <AvatarImage src={seller.avatarUrl} alt={seller.name} />
          )}
          <AvatarFallback className="text-[10px]">
            {sellerInitials}
          </AvatarFallback>
        </Avatar>

        <span className="truncate text-xs text-muted-foreground">
          {seller.name}
        </span>

        {seller.verified && (
          <BadgeCheck className="size-4 shrink-0 text-primary" />
        )}

        {seller.isNew && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            New Seller
          </Badge>
        )}

        {listing.rating != null && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground font-mono">
            ★ {listing.rating.toFixed(1)}
            {listing.reviewCount ? ` (${listing.reviewCount})` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
