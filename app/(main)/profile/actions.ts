"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startConversationWithSeller(sellerId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (sellerId === user.id) redirect("/");

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .is("listing_id", null)
    .maybeSingle();

  let id = existing?.id as string | undefined;

  if (!id) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ buyer_id: user.id, seller_id: sellerId, listing_id: null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    id = created.id;
  }

  redirect(`/messages/${id}`);
}