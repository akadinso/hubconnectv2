import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatDate, nameOf, one, rand, shortId } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { EscrowSteps } from "@/components/EscrowSteps";
import { OrderItemActions } from "@/components/OrderItemActions";
import { Button } from "@/components/ui/button";

const FUNDS: Record<string, string> = {
  held: "Held by HubConnect",
  released: "Released to seller",
  refunded: "Refunded to you",
};

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("orders")
    .select(
      `id, total, payment_method, created_at,
       items:order_items (
         id, title, unit_price, quantity, status, funds_status, listing_id,
         seller:profiles!seller_id ( username, full_name )
       )`,
    )
    .eq("buyer_id", user.id)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as any[];

  if (orders.length === 0) {
    return (
      <MaxWidthWrapper className="w-full space-y-4 py-16 text-center">
        <p className="text-muted-foreground">
          You haven't bought anything yet.
        </p>
        <Link href="/marketplace">
          <Button>Browse listings</Button>
        </Link>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper className="w-full max-w-3xl space-y-6 py-8">
      <h1 className="text-2xl font-bold">My orders</h1>

      {orders.map((order) => (
        <section key={order.id} className="space-y-4 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-medium">
              Order {shortId(order.id)}{" "}
              <span className="font-normal text-muted-foreground">
                · {formatDate(order.created_at)}
              </span>
            </p>
            <p className="font-semibold">{rand(order.total)}</p>
          </div>

          <ul className="divide-y">
            {(order.items ?? []).map((item: any) => (
              <li key={item.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Seller: {nameOf(one<any>(item.seller))} · {item.quantity}{" "}
                      × {rand(item.unit_price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {FUNDS[item.funds_status]}
                  </p>
                </div>

                <EscrowSteps status={item.status} />

                <Link
                  href={`/orders/${item.id}`}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Track order
                </Link>

                <OrderItemActions
                  role="buyer"
                  itemId={item.id}
                  orderId={order.id}
                  listingId={item.listing_id}
                  title={item.title}
                  status={item.status}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </MaxWidthWrapper>
  );
}
