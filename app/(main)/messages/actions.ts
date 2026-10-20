"use server";

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
  return error ? { error: error.message } : {};
}

export async function acceptOffer(offerId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_offer", { offer: offerId });
  return error ? { error: error.message } : {};
}

export async function declineOffer(offerId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_offer", { offer: offerId });
  return error ? { error: error.message } : {};
}

export async function withdrawOffer(offerId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_offer", { offer: offerId });
  return error ? { error: error.message } : {};
}