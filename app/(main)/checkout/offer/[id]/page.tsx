import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { one, rand } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { startOfferCheckout } from "../actions";
import { CheckoutShell } from "@/components/ChekoutShell";
import { buyerFeeLabel, getBuyerFee, getFees } from "@/lib/fees";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OfferCheckoutPage({
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
      <OfferCheckoutContent params={params} />
    </Suspense>
  );
}

async function OfferCheckoutContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: offer } = await supabase
    .from("offers")
    .select(
      `id, price, status, expires_at, conversation_id, buyer_id,
       listing:listings!listing_id (
         id, title, image_url, seller_id,
         seller:profiles!seller_id ( username, full_name, shop_name )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!offer || offer.buyer_id !== user.id) notFound();

  const listing = one<any>(offer.listing);
  const seller = one<any>(listing?.seller);
  const sellerName =
    seller?.shop_name || seller?.full_name || seller?.username || "Seller";
  const price = Number(offer.price);
  const fees = await getFees(supabase);
  const fee = await getBuyerFee(supabase, price, fees);

  const expired =
    offer.status === "pending" && new Date(offer.expires_at) < new Date();
  const usable =
    offer.status === "accepted" && new Date(offer.expires_at) > new Date();
  const backHref = `/messages/${offer.conversation_id}`;

  if (offer.status === "pending" && !expired) redirect(backHref);

  if (!usable || !listing) {
    return (
      <MaxWidthWrapper className="w-full max-w-md space-y-4 py-20 text-center">
        <h1 className="text-xl font-bold">
          This offer isn't available any more
        </h1>
        <p className="text-sm text-muted-foreground">
          It may have expired, been withdrawn or already been paid. Ask the
          seller for a new one.
        </p>
        <Link href={backHref}>
          <Button>Back to conversation</Button>
        </Link>
      </MaxWidthWrapper>
    );
  }

  const { data: statsData } = await supabase.rpc("seller_public_stats", {
    sid: listing.seller_id,
  });
  const stats: any = Array.isArray(statsData) ? statsData[0] : statsData;
  const rating = stats?.rating != null ? Number(stats.rating) : null;

  const summary = (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Order summary
      </h2>

      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          {listing.image_url && (
            <Image
              src={listing.image_url}
              alt={listing.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{listing.title}</p>
          <p className="text-xs text-muted-foreground">
            {sellerName}
            {rating != null ? ` · ${rating.toFixed(1)} ★` : ""}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Agreed price from your chat with the seller
      </p>
      <Separator />

      <div className="flex justify-between text-base font-medium text-muted-foreground">
        <span>Item price</span>
        <span>{rand(price)}</span>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Buyer protection ({buyerFeeLabel(fees)})</span>
        <span>{rand(fee)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{rand(price + fee)}</span>
      </div>
    </div>
  );

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-6 py-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Back to conversation
      </Link>

      <h1 className="text-3xl font-bold">Checkout</h1>

      <CheckoutShell
        summary={summary}
        demo={process.env.PAYMENTS_MODE === "demo"}
        action={startOfferCheckout.bind(null, id)}
      />
    </MaxWidthWrapper>
  );
}
