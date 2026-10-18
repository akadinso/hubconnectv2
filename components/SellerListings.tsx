"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import type { SellerListing } from "@/types/seller-listings";

const BADGE: Record<string, string> = {
  active: "resolved",
  draft: "in_review",
  archived: "dismissed",
};

export function SellerListings({ listings }: { listings: SellerListing[] }) {
  const router = useRouter();

  async function archive(listing: SellerListing) {
    if (
      !confirm(
        `Archive "${listing.title}"? Buyers won't see it, and only an admin can restore it.`,
      )
    ) {
      return;
    }
    const { error } = await createClient()
      .from("listings")
      .update({ status: "archived" })
      .eq("id", listing.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing archived");
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">My listings</h2>
        <Link href="/seller/listings/new">
          <Button size="sm">
            <Plus />
            New listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't listed anything yet.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {listings.map((l) => (
            <li key={l.id} className="flex items-center gap-3 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {l.image_url && (
                  <Image
                    src={l.image_url}
                    alt={l.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {l.price != null
                    ? `R${Number(l.price).toFixed(2)}`
                    : "No price"}{" "}
                  · <span className="capitalize">{l.type}</span>
                </p>
              </div>

              <StatusBadge status={BADGE[l.status]} />

              <Link href={`/seller/listings/${l.id}/edit`}>
                <Button size="sm" variant="outline">
                  <Pencil />
                  Edit
                </Button>
              </Link>
              {l.status !== "archived" && (
                <Button size="sm" variant="ghost" onClick={() => archive(l)}>
                  Archive
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
