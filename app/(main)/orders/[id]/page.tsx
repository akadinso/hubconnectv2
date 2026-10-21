import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate, nameOf, one, rand, shortId } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { CodeEntry } from "@/components/CodeEntry";
import {
  DELIVERY_LABEL,
  HandoverCode,
  handoverHint,
} from "@/components/HandoverCode";
import { OrderItemActions } from "@/components/OrderItemActions";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { OrderTimeline, type TimelineStep } from "@/components/OrderTimeline";
import { RatingDialog } from "@/components/RatingDialog";
import { Button } from "@/components/ui/button";
import { startConversation } from "@/app/(main)/listings/[id]/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage({
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
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: item } = await supabase
    .from("order_items")
    .select(
      `id, title, unit_price, quantity, status, listing_id, seller_id, released_at,
       listing:listings!listing_id ( image_url ),
       seller:profiles!seller_id ( username, full_name, shop_name ),
       order:orders!inner (
         id, buyer_id, total, paid_at, created_at, delivery_method, payment_status,
         buyer:profiles!buyer_id ( username, full_name )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  const order = one<any>(item.order);
  if (!order || order.payment_status !== "paid") notFound();

  const role: "buyer" | "seller" | "admin" =
    order.buyer_id === user.id
      ? "buyer"
      : item.seller_id === user.id
        ? "seller"
        : "admin";

  const [{ data: codeRow }, { data: disputes }] = await Promise.all([
    role === "buyer"
      ? supabase
          .from("handover_codes")
          .select("code")
          .eq("order_item_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null as { code: string } | null }),
    supabase
      .from("disputes")
      .select("id, reason, status")
      .eq("order_id", order.id)
      .in("status", ["open", "in_review"])
      .limit(1),
  ]);

  const seller = one<any>(item.seller);
  const buyer = one<any>(order.buyer);
  const sellerName = seller?.shop_name || nameOf(seller, "Seller");
  const buyerName = nameOf(buyer, "Buyer");
  const image = one<any>(item.listing)?.image_url as string | undefined;

  const completed = item.status === "completed";
  const cancelled = item.status === "cancelled";
  const open = item.status === "pending" || item.status === "confirmed";
  const dispute = disputes?.[0] ?? null;
  const paused = open && !!dispute;
  const campus = order.delivery_method !== "courier";

  const steps: TimelineStep[] = [
    {
      title: "Payment received",
      text: "Held safely by HubConnect",
      done: true,
      date: formatDate(order.paid_at ?? order.created_at),
    },
    {
      title: campus ? "Meet on campus" : "Courier delivery",
      text:
        role === "seller"
          ? campus
            ? "Meet the buyer and hand over the item"
            : "Get the item to the buyer by courier"
          : campus
            ? "Meet the seller and check your item"
            : "Your item is on its way. Check it when it arrives",
      done: completed,
      current: open && !paused,
    },
    {
      title: "Code confirmed",
      text:
        role === "seller"
          ? "Enter the buyer's code to release your payment"
          : "Share your code once you're happy with the item",
      done: completed,
    },
    {
      title: "Payment released",
      text: "The seller has been paid",
      done: completed,
      date: item.released_at ? formatDate(item.released_at) : null,
    },
  ];

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-6 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>

      {/* Item summary */}
      <section className="flex items-center gap-4 rounded-xl bg-muted/60 p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {role === "seller"
              ? `Buyer: ${buyerName}`
              : `Seller: ${sellerName}`}{" "}
            · {item.quantity} × {rand(item.unit_price)}
          </p>
          <p className="text-xs text-muted-foreground">
            Order {shortId(order.id)} · {formatDate(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">
            {rand(Number(item.unit_price) * item.quantity)}
          </p>
          <OrderStatusChip status={paused ? "pending" : item.status} />
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-[1fr_minmax(0,22rem)]">
        {/* Timeline */}
        <section className="space-y-4">
          <h2 className="font-semibold">Order Status</h2>

          {cancelled ? (
            <p className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
              This item was cancelled and the buyer was refunded.
            </p>
          ) : (
            <OrderTimeline steps={steps} />
          )}

          {order.delivery_method && (
            <p className="text-xs text-muted-foreground">
              Delivery: {DELIVERY_LABEL[order.delivery_method]}
            </p>
          )}
        </section>

        {/* What to do next */}
        <aside className="space-y-4 self-start rounded-xl border p-5">
          {cancelled ? (
            <>
              <p className="font-semibold">Refunded</p>
              <p className="text-sm text-muted-foreground">
                {role === "buyer"
                  ? "Your payment is being returned to you."
                  : "This item was cancelled, so no payment is due."}
              </p>
            </>
          ) : paused ? (
            <>
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-warning" />
                <p className="font-semibold">Payment paused</p>
              </div>
              <p className="text-sm text-muted-foreground">
                A dispute is open on this order ({dispute!.reason}). The payment
                stays held while the HubConnect team looks into it, and nobody
                can release it until it's resolved.
              </p>
            </>
          ) : completed ? (
            role === "buyer" ? (
              <>
                <p className="font-semibold">All done</p>
                <p className="text-sm text-muted-foreground">
                  How was your order? Your rating helps other students.
                </p>
                {item.listing_id && (
                  <RatingDialog
                    listingId={item.listing_id}
                    listingTitle={item.title}
                    listingImage={image ?? null}
                    sellerName={sellerName}
                    trigger={<Button className="w-full">Rate seller</Button>}
                  />
                )}
              </>
            ) : (
              <>
                <p className="font-semibold">Payment released</p>
                <p className="text-sm text-muted-foreground">
                  {rand(Number(item.unit_price) * item.quantity)} is now in your
                  wallet.
                </p>
                <Link href="/seller">
                  <Button variant="outline" className="w-full">
                    View my wallet
                  </Button>
                </Link>
              </>
            )
          ) : role === "buyer" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your handover code
              </p>
              {codeRow ? (
                <>
                  <HandoverCode code={codeRow.code} />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {handoverHint(order.delivery_method)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No code for this order. Use "Item received" below once you
                  have your item.
                </p>
              )}
              <OrderItemActions
                role="buyer"
                itemId={item.id}
                orderId={order.id}
                listingId={item.listing_id}
                title={item.title}
                status={item.status}
                image={image ?? null}
                sellerName={sellerName}
              />
              {item.listing_id && (
                <form action={startConversation.bind(null, item.listing_id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Message seller
                  </Button>
                </form>
              )}
            </>
          ) : role === "seller" ? (
            <>
              <p className="font-semibold">Enter the buyer's code</p>
              <p className="text-sm text-muted-foreground">
                Ask {buyerName} for the 4-digit code once they've checked the
                item. Entering it releases your payment.
              </p>
              <CodeEntry itemId={item.id} />
              <OrderItemActions
                role="seller"
                itemId={item.id}
                orderId={order.id}
                listingId={item.listing_id}
                title={item.title}
                status={item.status}
              />
              <Link href="/messages">
                <Button variant="ghost" size="sm">
                  Message buyer
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Viewing as an admin. Only the buyer and seller can act on this
              order.
            </p>
          )}
        </aside>
      </div>
    </MaxWidthWrapper>
  );
}
