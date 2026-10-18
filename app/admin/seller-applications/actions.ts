"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewApplication(
  id: string,
  decision: "approved" | "rejected",
  note: string,
): Promise<{ error?: string }> {
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

  const clean = note.trim();
  if (decision === "rejected" && clean.length < 3) {
    return { error: "Add a short reason so the applicant knows what to fix." };
  }

  const { data: app } = await supabase
    .from("seller_applications")
    .select("id, status, user_id, business_name")
    .eq("id", id)
    .maybeSingle();

  if (!app) return { error: "Application not found." };
  if (app.status !== "pending") return { error: "This application was already reviewed." };

  if (decision === "approved") {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "seller", shop_name: app.business_name })
      .eq("id", app.user_id);
    if (error) return { error: error.message };
  }

  const { error } = await supabase
    .from("seller_applications")
    .update({
      status: decision,
      admin_note: clean || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/seller-applications");
  return {};
}