"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const OFFERINGS = ["products", "services", "both"];

export async function submitApplication(input: {
  businessName: string;
  offering: string;
  categoryId: string;
  description: string;
  agreed: boolean;
}): Promise<{ error?: string }> {
  const businessName = input.businessName.trim();
  const description = input.description.trim();

  if (businessName.length < 3 || businessName.length > 60) {
    return { error: "Business name must be 3 to 60 characters." };
  }
  if (!OFFERINGS.includes(input.offering)) {
    return { error: "Choose what you'll sell." };
  }
  if (description.length < 20 || description.length > 500) {
    return { error: "Describe what you'll sell in 20 to 500 characters." };
  }
  if (!input.agreed) return { error: "Please accept the marketplace rules." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "buyer") return { error: "Your account can already sell." };

  const { error } = await supabase.from("seller_applications").insert({
    user_id: user.id,
    business_name: businessName,
    description,
    offering: input.offering,
    category_id: input.categoryId || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have an application under review." };
    }
    return { error: error.message };
  }

  revalidatePath("/seller/onboarding");
  return {};
}