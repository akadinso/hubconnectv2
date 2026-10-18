"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function startOfferCheckout(
  offerId: string,
  method: string,
  delivery: string,
): Promise<{ error: string } | { redirectTo: string }> {
  // Fails closed: nothing is marked paid unless demo mode is on
  if (process.env.PAYMENTS_MODE !== "demo") {
    return { error: "Live payments aren't switched on yet." };
  }
  if (!["card", "eft"].includes(method)) return { error: "Choose a payment method." };
  if (!["campus", "courier"].includes(delivery)) return { error: "Choose how you'll get it." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out." };

  const { data, error } = await supabase.rpc("create_order_from_offer", { offer: offerId });
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
      delivery_method: delivery,
      payfast_payment_id: `DEMO-${String(row.o_id).slice(0, 8)}`,
      paid_at: new Date().toISOString(),
    })
    .eq("id", row.o_id)
    .eq("buyer_id", user.id)
    .eq("payment_status", "pending")
    .select("id");

  if (payError || !updated?.length) return { error: "Payment could not be completed." };

  await admin
    .from("offers")
    .update({ status: "paid" })
    .eq("id", offerId)
    .eq("buyer_id", user.id);

  return { redirectTo: `/checkout/success?order=${row.o_id}` };
}