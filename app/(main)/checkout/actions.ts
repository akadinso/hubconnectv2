"use server";

import { createClient } from "@/lib/supabase/server";
import { buildCheckout } from "@/lib/payfast";

export async function startCheckout(): Promise<
  { error: string } | { action: string; fields: Record<string, string> }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out." };

  const { data, error } = await supabase.rpc("create_order_from_cart");
  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Could not create your order." };

  return buildCheckout({
    orderId: row.o_id,
    total: Number(row.o_total),
    email: user.email ?? "",
  });
}