"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const METHODS = ["card", "eft"];

export async function startCheckout(
  method: string,
): Promise<{ error: string } | { redirectTo: string }> {
  // Fails closed: nothing is marked paid unless demo mode is on
  if (process.env.PAYMENTS_MODE !== "demo") {
    return { error: "Live payments aren't switched on yet." };
  }
  if (!METHODS.includes(method)) return { error: "Choose a payment method." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out." };

  const { data, error } = await supabase.rpc("create_order_from_cart");
  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Could not create your order." };

  // Demo only: pretend the payment provider confirmed the payment
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: updated, error: payError } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: method,
      payfast_payment_id: `DEMO-${String(row.o_id).slice(0, 8)}`,
      paid_at: new Date().toISOString(),
    })
    .eq("id", row.o_id)
    .eq("buyer_id", user.id)
    .eq("payment_status", "pending")
    .select("id");

  if (payError || !updated?.length) {
    return { error: "Payment could not be completed." };
  }

  const { data: items } = await admin
    .from("order_items")
    .select("listing_id")
    .eq("order_id", row.o_id);

  const ids = (items ?? []).map((i) => i.listing_id).filter(Boolean);
  if (ids.length) {
    await admin
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .in("listing_id", ids);
  }

  return { redirectTo: `/checkout/success?order=${row.o_id}` };
}