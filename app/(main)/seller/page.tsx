import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatDate, nameOf, one, rand } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { EscrowSteps } from "@/components/EscrowSteps";
import { OrderItemActions } from "@/components/OrderItemActions";
import { PayoutForm } from "@/components/PayoutForm";
import { SellerListings } from "@/components/SellerListings";
import { StatusBadge } from "@/components/StatusBadge";
import type { SellerListing } from "@/types/seller-listings";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { getFees, pct } from "@/lib/fees";
import { weekLabel } from "@/lib/weeks";

export default function SellerPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <SellerContent />
    </Suspense>
  );
}

async function SellerContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "seller" && profile?.role !== "admin") redirect("/");

  const [walletRes, payoutsRes, salesRes, listingsRes, weeksRes] =
    await Promise.all([
      supabase.rpc("seller_wallet"),
      supabase
        .from("payouts")
        .select("id, amount, status, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("order_items")
        .select(
          `id, title, unit_price, quantity, status, funds_status, listing_id,
         order:orders!inner (
           id, created_at, payment_status,
           buyer:profiles!buyer_id ( username, full_name )
         )`,
        )
        .eq("seller_id", user.id)
        .eq("order.payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("listings")
        .select(
          "id, title, description, price, image_url, images, type, category_id, condition, rate_type, availability, status",
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("weekly_seller_revenue")
        .select("week_start, gross, fee, net, items_sold")
        .eq("seller_id", user.id)
        .order("week_start", { ascending: false })
        .limit(8),
    ]);

  const w: any = Array.isArray(walletRes.data)
    ? walletRes.data[0]
    : walletRes.data;
  const fees = await getFees(supabase);
  const salesMonth = Number(w?.sales_month ?? 0);
  const feesMonth = Number(w?.fees_month ?? 0);
  const capLeft = Number(w?.cap_left ?? fees.sellerMonthlyCap);
  const capPct =
    fees.sellerMonthlyCap > 0
      ? Math.min(100, (feesMonth / fees.sellerMonthlyCap) * 100)
      : 0;
  const held = Number(w?.held ?? 0);
  const available = Number(w?.available ?? 0);
  const paidOut = Number(w?.paid_out ?? 0);

  const payouts = (payoutsRes.data ?? []) as any[];
  const sales = (salesRes.data ?? []) as any[];
  const listings = (listingsRes.data ?? []) as SellerListing[];

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-8 py-8">
      <h1 className="text-2xl font-bold">Seller dashboard</h1>

      {/* Wallet */}
      <section className="space-y-4">
        <h2 className="font-semibold">My wallet</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "In escrow",
              value: held,
              hint: "Waiting for buyers to confirm",
            },
            {
              label: "Paid out every week",
              value: available,
              hint: "Ready to pay out",
            },
            { label: "Paid out", value: paidOut, hint: "Sent to your bank" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold">{rand(s.value)}</p>
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">This month</p>
            <p className="text-xs text-muted-foreground">
              {pct(fees.sellerRate)} fee, never more than{" "}
              {rand(fees.sellerMonthlyCap)} a month
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${capPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sales {rand(salesMonth)} · Fees so far {rand(feesMonth)} ·{" "}
            {capLeft <= 0
              ? "Cap reached: no more fees until the 1st"
              : `${rand(capLeft)} left before the cap`}
            . The fee comes off your payouts, so you never get a bill.{" "}
            <Link href="/fees" className="underline underline-offset-4">
              How fees work
            </Link>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          We pay out every week. Need it sooner? Ask below.
        </p>

        <PayoutForm available={available} />

        {payouts.length > 0 && (
          <ul className="divide-y rounded-xl border text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3">
                <span>
                  {rand(p.amount)}{" "}
                  <span className="text-muted-foreground">
                    · {formatDate(p.created_at)}
                  </span>
                </span>
                <StatusBadge
                  status={
                    p.status === "requested"
                      ? "open"
                      : p.status === "paid"
                        ? "resolved"
                        : "dismissed"
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {(weeksRes.data ?? []).length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="p-3 font-normal">Week</th>
                <th className="p-3 text-right font-normal">Sales</th>
                <th className="p-3 text-right font-normal">Fee</th>
                <th className="p-3 text-right font-normal">You get</th>
              </tr>
            </thead>
            <tbody>
              {(weeksRes.data as any[]).map((w) => (
                <tr key={w.week_start} className="border-b last:border-0">
                  <td className="p-3">{weekLabel(w.week_start)}</td>
                  <td className="p-3 text-right">{rand(w.gross)}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {rand(w.fee)}
                  </td>
                  <td className="p-3 text-right font-medium">{rand(w.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listings: the component draws its own heading and "New listing" button */}
      <SellerListings listings={listings} />

      {/* Orders to fulfil */}
      <section className="space-y-4">
        <h2 className="font-semibold">Orders to fulfil</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid orders yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {sales.map((item) => {
              const order = one<any>(item.order);
              return (
                <li key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Buyer: {nameOf(one<any>(order?.buyer))} ·{" "}
                        {item.quantity} × {rand(item.unit_price)} ·{" "}
                        {formatDate(order?.created_at)}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium">
                      {rand(Number(item.unit_price) * item.quantity)}
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
                    role="seller"
                    itemId={item.id}
                    orderId={order?.id}
                    listingId={item.listing_id}
                    title={item.title}
                    status={item.status}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </MaxWidthWrapper>
  );
}
