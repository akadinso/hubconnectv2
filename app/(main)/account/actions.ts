"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateBasicProfile(input: {
  fullName: string;
  bio: string;
  avatar: "keep" | "remove" | "uploaded";
}): Promise<{ error?: string }> {
  const fullName = input.fullName.trim();
  const bio = input.bio.trim();

  if (fullName.length < 2 || fullName.length > 60) {
    return { error: "Enter your name (2 to 60 characters)." };
  }
  if (bio.length > 300) return { error: "Your bio can be up to 300 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const update: Record<string, unknown> = {
    full_name: fullName,
    bio: bio || null,
  };

  if (input.avatar === "uploaded") {
    const { data } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/avatar`);
    update.avatar_url = `${data.publicUrl}?v=${Date.now()}`;
  } else if (input.avatar === "remove") {
    update.avatar_url = null;
    await supabase.storage.from("avatars").remove([`${user.id}/avatar`]);
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23514" ? "Some of those details aren't valid." : error.message };
  }

  revalidatePath("/", "layout"); // refreshes the Navbar avatar and name
  return {};
}