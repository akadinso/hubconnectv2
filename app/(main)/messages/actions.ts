"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export async function sendOffer(
  conversationId: string,
  listingId: string,
  price: number,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_offer", {
    conv: conversationId,
    lid: listingId,
    amount: price,
  });
  if (error) return { error: error.message };

  revalidatePath(`/messages/${conversationId}`);
  return {};
}

export async function declineOffer(offerId: string, conversationId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_offer", { offer: offerId });
  if (error) return { error: error.message };

  revalidatePath(`/messages/${conversationId}`);
  return {};
}

export async function withdrawOffer(offerId: string, conversationId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_offer", { offer: offerId });
  if (error) return { error: error.message };

  revalidatePath(`/messages/${conversationId}`);
  return {};
}