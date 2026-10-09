import type { SupabaseClient } from "@supabase/supabase-js";

export type GetListingsOptions = {
  limit?: number;
  sort?: "rating" | "newest";
  search?: string;
  type?: "product" | "service";
};

export async function getListings(
  supabase: SupabaseClient,
  options: GetListingsOptions = {}
) {
  const { limit = 60, sort, search, type } = options;

  let query = supabase.from("listings").select("*");

  // Search by title or description
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Filter by listing type (product or service)
  if (type) {
    query = query.eq("type", type);
  }

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching listings:", error);
    return [];
  }

  return data ?? [];
}