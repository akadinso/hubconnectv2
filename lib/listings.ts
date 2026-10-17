import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/types/listing";

type GetListingsOptions = {
  limit?: number;
  sort?: "newest" | "rating";
  search?: string;
  type?: "product" | "service";
  sellerId?: string;
};

const SELECT = `
  id,
  title,
  description,
  price,
  type,
  image_url,
  rating,
  review_count,
  created_at,
  seller:profiles!seller_id (
    username,
    full_name,
    avatar_url,
    role,
    verified,
    created_at
  )
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
    description: row.description ?? "",
    price: row.price ?? 0,
    type: row.type ?? "product",
    image: row.image_url,
    image_url: row.image_url ?? null,
    rating: row.rating,
    reviewCount: row.review_count,
    seller: {
      name: row.seller?.username ?? row.seller?.full_name ?? "Seller",
      avatarUrl: row.seller?.avatar_url ?? null,
      verified: row.seller?.verified ?? false,
      isNew,
    },
  };
}

export async function getListings(
  supabase: SupabaseClient,
  opts: GetListingsOptions = {},
): Promise<Listing[]> {
  const { limit = 20, sort = "newest", search, type, sellerId } = opts;

  let query = supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "active") // drafts and archived listings never show in lists
    .order(sort === "rating" ? "rating" : "created_at", {
      ascending: false,
      nullsFirst: false,
    });

  // Strip characters that would break the PostgREST filter string
  const term = search?.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
  if (term) {
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (type) query = query.eq("type", type);
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error("Listings error:", error);
    return [];
  }

  return (data ?? []).map(toListing);
}