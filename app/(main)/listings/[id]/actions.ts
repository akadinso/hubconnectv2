"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cleanPhotoPaths } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

export async function startConversation(listingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.seller_id === user.id) {
    redirect(`/listings/${listingId}`);
  }

  // Reuse the conversation if this buyer already started one for this listing
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    conversationId = created.id;
  }

  redirect(`/messages/${conversationId}`);
}

export async function submitReview(
  listingId: string,
  rating: number,
  comment: string,
  photos: string[] = [],
): Promise<{ error?: string }> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please choose a rating from 1 to 5." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to leave a review." };

  const newPhotos = cleanPhotoPaths(photos, user.id);
  if (!newPhotos) {
    return { error: "One of the photos couldn't be used. Please try again." };
  }

  // Editing a review keeps the photos it already has and adds the new ones
  const { data: existing } = await supabase
    .from("reviews")
    .select("photos")
    .eq("listing_id", listingId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  const kept: string[] = existing?.photos ?? [];
  if (kept.length + newPhotos.length > 4) {
    return { error: "A review can have up to 4 photos in total." };
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      listing_id: listingId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
      photos: [...kept, ...newPhotos],
    },
    { onConflict: "listing_id,reviewer_id" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/listings/${listingId}`);
  return {};
}