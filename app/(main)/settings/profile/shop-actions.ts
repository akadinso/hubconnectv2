"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SHOP_TAGS } from "@/lib/marketplace-options";

export async function updateShop(input: {
  shopName: string;
  tagline: string;
  tags: string[];
  expectedGraduation: string;
}): Promise<{ error?: string }> {
  const shopName = input.shopName.trim();
  const tagline = input.tagline.trim();
  const tags = input.tags.filter((t) => SHOP_TAGS.includes(t)).slice(0, 5);
  const graduation = input.expectedGraduation.trim();

  if (shopName && (shopName.length < 3 || shopName.length > 60)) {
    return { error: "Shop name must be 3 to 60 characters." };
  }
  if (tagline.length > 120) return { error: "Tagline can be up to 120 characters." };
  if (graduation && !/^\d{4}-\d{2}-\d{2}$/.test(graduation)) {
    return { error: "Enter a valid graduation date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      shop_name: shopName || null,
      tagline: tagline || null,
      shop_tags: tags,
      expected_graduation: graduation || null,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23514" ? "Some of those details aren't valid." : error.message };
  }

  revalidatePath("/", "layout");
  return {};
}