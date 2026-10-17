"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function updateProfile(input: {
  fullName: string;
  username: string;
  bio: string;
  avatar: "keep" | "remove" | "uploaded";
}): Promise<{ error?: string; username?: string }> {
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const bio = input.bio.trim();

  if (fullName.length < 2 || fullName.length > 60) {
    return { error: "Enter your name (2 to 60 characters)." };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      error: "Username must be 3 to 20 characters: letters, numbers or underscores.",
    };
  }
  if (bio.length > 300) return { error: "Bio can be up to 300 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const update: Record<string, unknown> = {
    full_name: fullName,
    username,
    bio: bio || null,
  };

  if (input.avatar === "uploaded") {
    // The file was uploaded to the user's own folder; build the URL on the server
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
    if (error.code === "23505") return { error: "That username is already taken." };
    if (error.code === "23514") return { error: "Some of those details aren't valid." };
    return { error: error.message };
  }

  revalidatePath("/", "layout"); // refreshes the Navbar avatar and name
  return { username };
}