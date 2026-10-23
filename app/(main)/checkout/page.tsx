import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaymentPanel } from "@/components/PaymentPanel";
import { buyerFeeLabel, getBuyerFee, getFees } from "@/lib/fees";
import { rand } from "@/lib/format";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rows } = await supabase
    .from("cart_items")
    .select(
      "quantity, listing:listings ( id, title, price, image_url, status, seller_id )",
    )
    .order("created_at");

  const lines = (rows ?? []).map((row: any) => {
    const l = Array.isArray(row.listing) ? row.listing[0] : row.listing;
    const price = l?.price != null ? Number(l.price) : null;
    const available =
      !!l && l.status === "active" && price !== null && l.seller_id !== user.id;
    return { quantity: row.quantity as number, listing: l, price, available };
  });

  const unavailable = lines.filter((l) => !l.available);
  const total = lines.reduce(
    (sum, l) => sum + (l.available ? l.price! * l.quantity : 0),
    0,
  );
  const fees = await getFees(supabase);
  const fee = await getBuyerFee(supabase, total, fees);
  if (lines.length === 0) {
    return (
      <MaxWidthWrapper className="w-full space-y-4 py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href="/marketplace">
          <Button>Browse listings</Button>
        </Link>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper className="w-full max-w-2xl space-y-6 py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <ul className="space-y-3">
        {lines.map((line, i) => (
          <li
            key={line.listing?.id ?? i}
            className="flex items-center gap-4 rounded-xl border p-3"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {line.listing?.image_url && (
                <Image
                  src={line.listing.image_url}
                  alt={line.listing.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {line.listing?.title ?? "Unavailable item"}
              </p>
              <p className="text-sm text-muted-foreground">
                {line.available
                  ? `${line.quantity} × R${line.price!.toFixed(2)}`
                  : "No longer available"}
              </p>
            </div>
            {line.available && (
              <p className="font-medium">
                R{(line.price! * line.quantity).toFixed(2)}
              </p>
            )}
          </li>
        ))}
      </ul>

      {unavailable.length > 0 && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Some items can't be bought right now. Remove them from your cart to
          continue.
        </p>
      )}

      <Separator />

      <Separator />

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Items</span>
          <span>{rand(total)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Buyer protection ({buyerFeeLabel(fees)})</span>
          <span>{rand(fee)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-lg font-bold">
        <span>Total</span>
        <span>{rand(total + fee)}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Buyer protection means your money is held until you get your item.{" "}
        <Link href="/fees" className="underline underline-offset-4">
          How fees work
        </Link>
      </p>

      <PaymentPanel
        total={total + fee}
        disabled={unavailable.length > 0}
        demo={process.env.PAYMENTS_MODE === "demo"}
      />
    </MaxWidthWrapper>
  );
}
