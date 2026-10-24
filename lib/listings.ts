import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/types/listing";
import { one } from "@/lib/format";

export type ListingSort = "newest" | "rating" | "price_asc" | "price_desc";

type GetListingsOptions = {
  limit?: number;
  sort?: ListingSort;
  search?: string;
  type?: "product" | "service";
  sellerId?: string;
  campusId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  conditions?: string[];
  verifiedOnly?: boolean;
  minRating?: number;
};

// "!inner" turns the seller join into a filter, which "verified sellers only" needs
const buildSelect = (inner: boolean) => `
  id,
  title,
  description,
  price,
  type,
  image_url,
  rating,
  review_count,
  created_at,
  campus:campuses!campus_id ( name ),
  seller:profiles!seller_id${inner ? "!inner" : ""} (
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
    campus: one<any>(row.campus)?.name ?? null,
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
  const {
    limit = 20,
    sort = "newest",
    search,
    type,
    sellerId,
    campusId,
    categoryId,
    minPrice,
    maxPrice,
    conditions,
    verifiedOnly,
    minRating,
  } = opts;

  let query = supabase
    .from("listings")
    .select(buildSelect(!!verifiedOnly))
    .eq("status", "active"); // drafts and archived listings never show in lists

  // Strip characters that would break the PostgREST filter string
  const term = search?.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
  if (term) {
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (type) query = query.eq("type", type);
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (campusId) query = query.eq("campus_id", campusId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (minPrice != null) query = query.gte("price", minPrice);
  if (maxPrice != null) query = query.lte("price", maxPrice);
  if (conditions?.length) query = query.in("condition", conditions);
  if (minRating != null) query = query.gte("rating", minRating);
  if (verifiedOnly) query = query.eq("seller.verified", true);

  switch (sort) {
    case "rating":
      query = query
        .order("rating", { ascending: false, nullsFirst: false })
        .order("review_count", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error("Listings error:", error);
    return [];
  }

  return (data ?? []).map(toListing);
}