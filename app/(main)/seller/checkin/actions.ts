"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ANSWERS = ["yes", "no", "not_sure"];

export async function submitCheckin(
  registered: string,
  bankAccount: string,
): Promise<{ error?: string }> {
  if (!ANSWERS.includes(registered) || !ANSWERS.includes(bankAccount)) {
    return { error: "Please answer both questions." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase.from("business_checkins").upsert(
    {
      user_id: user.id,
      registered,
      bank_account: bankAccount,
      answered_at: new Date().toISOString(),
      remind_after: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/seller/listings");
  return {};
}

// "Remind me later": hide the popup for a week
export async function snoozeCheckin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("business_checkins").upsert(
    { user_id: user.id, remind_after: week, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/seller/listings");
  return {};
}