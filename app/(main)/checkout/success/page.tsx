import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Button } from "@/components/ui/button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-16">Hello</MaxWidthWrapper>
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
    .select("id, total, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) notFound();

  const paid = order.payment_status === "paid";
  const pending = order.payment_status === "pending";

  return (
    <MaxWidthWrapper className="w-full max-w-md space-y-5 py-20 text-center">
      {paid ? (
        <CheckCircle2 className="mx-auto size-12 text-green-600" />
      ) : (
        <Clock3 className="mx-auto size-12 text-muted-foreground" />
      )}

      <h1 className="text-2xl font-bold">
        {paid
          ? "Payment received"
          : pending
            ? "Confirming your payment..."
            : "Payment not completed"}
      </h1>

      <p className="text-muted-foreground">
        {paid
          ? `Thanks! R${Number(order.total).toFixed(2)} paid. HubConnect holds it safely until you confirm you received your item.`
          : pending
            ? "This can take a few seconds. The page updates by itself."
            : "Your order wasn't paid. Your cart is still saved, so you can try again."}
      </p>

      {pending && <AutoRefresh />}

      <Link href={paid ? "/orders" : "/checkout"}>
        <Button>{paid ? "View my orders" : "Back to checkout"}</Button>
      </Link>
    </MaxWidthWrapper>
  );
}
