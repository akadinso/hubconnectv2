import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/types/listing";

// Adjust the column names to match your LISTINGS table.
const SELECT = `
  id, title, description, image_url, rating, review_count, created_at,
  seller:profiles!seller_id ( username, full_name, avatar_url, created_at )
`;

function toListing(row: any): Listing {
  const sellerJoined = row.seller?.created_at
    ? new Date(row.seller.created_at)
    : null;
  const isNew =
    !!sellerJoined &&
    Date.now() - sellerJoined.getTime() < 30 * 24 * 60 * 60 * 1000;

  return {
    id: row.id,
    title: row.title,
    subtitle: row.description,
    image: row.image_url,
    rating: row.rating,
    reviewCount: row.review_count,
    seller: {
      name: row.seller?.username ?? row.seller?.full_name ?? "Seller",
      avatarUrl: row.seller?.avatar_url,
      isNew,
    },
  };
}

export async function getListings(
  supabase: SupabaseClient,
  opts: { limit?: number; sort?: "newest" | "rating" } = {},
) {
  const { limit = 20, sort = "newest" } = opts;

  const { data, error } = await supabase
    .from("listings")
    .select(SELECT)
    .order(sort === "rating" ? "rating" : "created_at", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit);

  if (error) {
    console.error("Listings error:", error);
    return [];
  }

  return data.map(toListing);
}