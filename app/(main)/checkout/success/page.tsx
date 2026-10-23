import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { nameOf, one, rand } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  DELIVERY_LABEL,
  HandoverCode,
  handoverHint,
} from "@/components/HandoverCode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startConversation } from "@/app/(main)/listings/[id]/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METHOD: Record<string, string> = { card: "Card", eft: "Instant EFT" };

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-16">Loading...</MaxWidthWrapper>
      }
    >
      <Status searchParams={searchParams} />
    </Suspense>
  );
}

async function Status({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId || !UUID.test(orderId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, total, payment_status, payment_method, delivery_method,items_total, buyer_fee,
       items:order_items (
         id, title, unit_price, quantity, listing_id,
         listing:listings!listing_id ( image_url ),
         seller:profiles!seller_id ( username, full_name, shop_name )
       )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) notFound();

  const paid = order.payment_status === "paid";
  const pending = order.payment_status === "pending";
  const items = (order.items ?? []) as any[];

  const { data: codeRows } = paid
    ? await supabase
        .from("handover_codes")
        .select("order_item_id, code")
        .eq("order_id", orderId)
    : { data: [] as any[] };
  const codes = new Map(
    (codeRows ?? []).map((c: any) => [c.order_item_id, c.code as string]),
  );

  if (!paid) {
    return (
      <MaxWidthWrapper className="w-full max-w-md space-y-5 py-20 text-center">
        <Clock3 className="mx-auto size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">
          {pending ? "Confirming your payment..." : "Payment not completed"}
        </h1>
        <p className="text-muted-foreground">
          {pending
            ? "This can take a few seconds. The page updates by itself."
            : "Your order wasn't paid. Your cart is still saved, so you can try again."}
        </p>
        {pending && <AutoRefresh />}
        <Link href={pending ? "/orders" : "/checkout"}>
          <Button>{pending ? "My orders" : "Back to checkout"}</Button>
        </Link>
      </MaxWidthWrapper>
    );
  }

  const single = items.length === 1 ? items[0] : null;

  return (
    <MaxWidthWrapper className="w-full max-w-md space-y-6 py-10">
      <div className="space-y-6 rounded-2xl bg-muted/60 p-6">
        <div className="space-y-2 text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="text-xl font-bold">Payment Successful</h1>
          <p className="text-xs text-muted-foreground">
            We're holding your payment safely until you get your item.
          </p>
        </div>

        {items.map((item) => {
          const seller = one<any>(item.seller);
          const image = one<any>(item.listing)?.image_url as string | undefined;
          const code = codes.get(item.id);

          return (
            <div
              key={item.id}
              className="space-y-4 rounded-xl bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {image && (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {seller?.shop_name || nameOf(seller, "Seller")}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {rand(Number(item.unit_price) * item.quantity)}
                </p>
              </div>

              {code && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your handover code
                  </p>
                  <HandoverCode code={code} />
                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    {handoverHint(order.delivery_method)}
                  </p>
                  <p className="text-center text-[11px] font-medium">
                    Only share it once you're happy with your item.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total paid</dt>
            <dd className="font-semibold">{rand(order.total)}</dd>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <dt>
              Items {rand(order.items_total)} · Buyer protection{" "}
              {rand(order.buyer_fee)}
            </dt>
          </div>
          {order.payment_method && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd>{METHOD[order.payment_method] ?? order.payment_method}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>
              {order.delivery_method ? (
                <Badge
                  variant="secondary"
                  className="bg-gold-lite text-gold-dark"
                >
                  {DELIVERY_LABEL[order.delivery_method]}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Arrange in chat
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3">
          <Link href={single ? `/orders/${single.id}` : "/orders"}>
            <Button className="w-full">Track your order</Button>
          </Link>
          {single?.listing_id && (
            <form action={startConversation.bind(null, single.listing_id)}>
              <Button type="submit" variant="outline" className="w-full">
                Message seller
              </Button>
            </form>
          )}
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
