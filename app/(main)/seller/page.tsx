import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatDate, nameOf, one, rand } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { EscrowSteps } from "@/components/EscrowSteps";
import { OrderItemActions } from "@/components/OrderItemActions";
import { PayoutForm } from "@/components/PayoutForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";

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

  const [walletRes, payoutsRes, salesRes] = await Promise.all([
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
  ]);

  const w: any = Array.isArray(walletRes.data)
    ? walletRes.data[0]
    : walletRes.data;
  const held = Number(w?.held ?? 0);
  const available = Number(w?.available ?? 0);
  const paidOut = Number(w?.paid_out ?? 0);

  const payouts = (payoutsRes.data ?? []) as any[];
  const sales = (salesRes.data ?? []) as any[];

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-8 py-8">
      <h1 className="text-2xl font-bold">Seller dashboard</h1>

      <section className="space-y-4">
        <h2 className="font-semibold">My wallet</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "In escrow",
              value: held,
              hint: "Waiting for buyers to confirm",
            },
            { label: "Available", value: available, hint: "Ready to pay out" },
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
