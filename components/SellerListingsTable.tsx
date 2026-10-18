"use client";

import Image from "next/image";
import type { SellerListing } from "@/types/seller-listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  data: SellerListing[];
  onEdit: (listing: SellerListing) => void;
  onDelete: (id: string) => void;
}

export function SellerListingsTable({ data, onEdit, onDelete }: Props) {
  const getStatusVariant = (status: SellerListing["status"]) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <th className="p-3">Image</th>
            <th className="p-3">Title</th>
            <th className="p-3">Type</th>
            <th className="p-3">Price</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((listing) => {
            const formattedPrice =
              typeof listing.price === "number"
                ? new Intl.NumberFormat("en-ZA", {
                    style: "currency",
                    currency: "ZAR",
                    maximumFractionDigits: 0,
                  }).format(listing.price)
                : "—";

            return (
              <tr
                key={listing.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="p-3">
                  <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                    {listing.image_url ? (
                      <Image
                        src={listing.image_url}
                        alt={listing.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 font-medium text-foreground max-w-[200px] truncate">
                  {listing.title}
                </td>
                <td className="p-3 capitalize text-muted-foreground">
                  {listing.type}
                </td>
                <td className="p-3 font-mono font-medium">{formattedPrice}</td>
                <td className="p-3">
                  <Badge
                    variant={getStatusVariant(listing.status)}
                    className="capitalize"
                  >
                    {listing.status}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(listing)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(listing.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
