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

export async function releaseWithCode(itemId: string, code: string): Promise<Result> {
  const clean = code.trim();
  if (!/^\d{4}$/.test(clean)) return { error: "Enter the 4-digit code." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_release_with_code", {
    item: itemId,
    entered: clean,
  });
  if (error) return { error: error.message };

  const outcome = String(data);

  if (outcome === "ok") {
    revalidatePath("/orders");
    revalidatePath(`/orders/${itemId}`);
    revalidatePath("/seller");
    return {};
  }

  if (outcome.startsWith("wrong:")) {
    const left = Number(outcome.split(":")[1]);
    return {
      error: `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`,
    };
  }

  const messages: Record<string, string> = {
    locked:
      "Too many wrong tries. Ask the buyer to confirm in their orders, or contact support.",
    paused: "Payment is paused while a dispute is open.",
    not_ready: "This order can't be completed right now.",
    no_code: "This order has no handover code. Ask the buyer to confirm instead.",
    forbidden: "You can't complete this order.",
  };
  return { error: messages[outcome] ?? "Something went wrong. Please try again." };
}