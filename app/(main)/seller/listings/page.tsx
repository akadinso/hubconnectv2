import { Suspense } from "react";
import Link from "next/link";

import { requireSeller } from "@/lib/seller";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { BusinessCheckinDialog } from "@/components/BusinessCheckinDialog";
import { MyListings } from "@/components/MyListings";
import { Button } from "@/components/ui/button";
import type { SellerListing } from "@/types/seller-listing";

export default function MyListingsPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <MyListingsContent />
    </Suspense>
  );
}

async function MyListingsContent() {
  const { supabase, user, profile } = await requireSeller();

  const [{ data }, { data: checkin }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, title, description, price, image_url, images, type, category_id, condition, rate_type, availability, status",
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_checkins")
      .select("answered_at, remind_after")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const listings = (data ?? []).map((l: any) => ({
    ...l,
    price: l.price != null ? Number(l.price) : null,
    images: l.images ?? [],
    availability: l.availability ?? [],
  })) as SellerListing[];

  const showCheckin =
    !checkin?.answered_at &&
    (!checkin?.remind_after || new Date(checkin.remind_after) < new Date());

  return (
    <MaxWidthWrapper className="w-full max-w-3xl space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <div className="flex items-center gap-4">
          {profile?.username && (
            <Link
              href={`/profile/${profile.username}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View my store
            </Link>
          )}
          <Link href="/seller/listings/new">
            <Button className="bg-gold text-navy hover:bg-gold/90">
              + Add new listing
            </Button>
          </Link>
        </div>
      </div>

      <MyListings listings={listings} />

      {showCheckin && <BusinessCheckinDialog />}
    </MaxWidthWrapper>
  );
}
