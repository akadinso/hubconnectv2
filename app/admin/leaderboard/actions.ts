"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setBusinessOfMonth(
  month: string,
  sellerId: string,
  blurb: string,
): Promise<{ error?: string }> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { error: "Invalid month." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not allowed." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") return { error: "Not allowed." };

  const { error } = await supabase.from("business_of_month").upsert(
    {
      month: `${month}-01`,
      seller_id: sellerId,
      blurb: blurb.trim().slice(0, 200) || null,
    },
    { onConflict: "month" },
  );
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/leaderboard");
  return {};
}