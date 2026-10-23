"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createWeeklyPayouts(): Promise<{ error?: string; created?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_weekly_payouts");
  if (error) return { error: error.message };

  revalidatePath("/admin/payouts");
  return { created: Number(data ?? 0) };
}

export async function markPayoutPaid(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Row level security only lets admins update payouts
  const { data, error } = await supabase
    .from("payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "requested")
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "Couldn't update it. It may already be paid." };

  revalidatePath("/admin/payouts");
  return {};
}