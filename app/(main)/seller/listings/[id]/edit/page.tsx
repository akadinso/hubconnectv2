import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireSeller } from "@/lib/seller";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ListingWizard } from "@/components/ListingWizard";
import type { SellerListing } from "@/types/seller-listing";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <EditListingContent params={params} />
    </Suspense>
  );
}

async function EditListingContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, seller } = await requireSeller();

  const [{ data: listing }, { data: categories }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, title, description, price, image_url, images, type, category_id, condition, rate_type, availability, status",
      )
      .eq("id", id)
      .eq("seller_id", user.id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!listing) notFound();

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-6 py-8">
      <Link
        href="/seller"
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Seller dashboard
      </Link>
      <ListingWizard
        categories={categories ?? []}
        seller={seller}
        initial={
          {
            ...listing,
            price: listing.price != null ? Number(listing.price) : null,
          } as SellerListing
        }
      />
    </MaxWidthWrapper>
  );
}
