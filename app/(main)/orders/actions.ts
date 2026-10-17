"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

async function runItemAction(
  fn: "seller_mark_handed_over" | "buyer_confirm_received" | "seller_cancel_item",
  itemId: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { item: itemId });
  if (error) return { error: error.message };

  revalidatePath("/orders");
  revalidatePath("/seller");
  return {};
}

export async function markHandedOver(itemId: string) {
  return runItemAction("seller_mark_handed_over", itemId);
}

export async function confirmReceived(itemId: string) {
  return runItemAction("buyer_confirm_received", itemId);
}

export async function cancelItem(itemId: string) {
  return runItemAction("seller_cancel_item", itemId);
}

export async function requestPayout(amount: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_payout", {
    amount_requested: amount,
  });
  if (error) return { error: error.message };

  revalidatePath("/seller");
  return {};
}