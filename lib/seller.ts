import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireSeller() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, shop_name, full_name, username, avatar_url, campus_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    redirect("/seller/onboarding");
  }

  const name =
    profile?.shop_name || profile?.full_name || profile?.username || "Seller";

  return { supabase, user, profile, seller: { name, avatarUrl: profile?.avatar_url ?? null } };
}