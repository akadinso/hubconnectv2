"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCampus(campusId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { data: campus } = await supabase
    .from("campuses")
    .select("id")
    .eq("id", campusId)
    .eq("active", true)
    .maybeSingle();
  if (!campus) return { error: "Choose a campus from the list." };

  const { error } = await supabase
    .from("profiles")
    .update({ campus_id: campus.id })
    .eq("id", user.id)
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}