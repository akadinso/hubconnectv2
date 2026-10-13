import {
  createClient as createSupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type { AdminListing } from "@/components/listings-table";
import { one } from "@/lib/format";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  verified: boolean;
  onboarded: boolean;
  bio: string;
  createdAt: string;
};

// Service-role client bypasses RLS. Only use it after requireAdmin() passes.
export function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function listAllAuthUsers(service: ReturnType<typeof getServiceClient>) {
  const all: User[] = [];
  const perPage = 100;

  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    all.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return all;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const service = getServiceClient();

  const [authUsers, profilesResult] = await Promise.all([
    listAllAuthUsers(service),
    service
      .from("profiles")
      .select(
        "id, username, full_name, bio, avatar_url, role, verified, onboarded, created_at",
      ),
  ]);

  if (profilesResult.error) {
    throw new Error(`Failed to fetch profiles: ${profilesResult.error.message}`);
  }

  const profilesById = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));

  return authUsers.map((authUser) => {
    const profile = profilesById.get(authUser.id);
    const metadata = authUser.user_metadata ?? {};

    return {
      id: authUser.id,
      fullName:
        profile?.full_name ??
        metadata.full_name ??
        metadata.name ??
        profile?.username ??
        "Unnamed user",
      email: authUser.email ?? "No email",
      username: profile?.username ?? "—",
      avatarUrl: profile?.avatar_url ?? null,
      role: profile?.role ?? "unassigned",
      verified: profile?.verified ?? false,
      onboarded: profile?.onboarded ?? false,
      bio: profile?.bio ?? "",
      createdAt: authUser.created_at,
    };
  });
}

export async function getAdminListings(): Promise<AdminListing[]> {
  const service = getServiceClient();

  const [authUsers, profilesResult, listingsResult] = await Promise.all([
    listAllAuthUsers(service),
    service
      .from("profiles")
      .select("id, username, full_name, avatar_url"),
    service
      .from("listings")
      .select(
        "id, title, price, status, created_at, seller_id, category:categories!category_id ( name )",
      )
      .order("created_at", { ascending: false }),
  ]);

  if (profilesResult.error) {
    throw new Error(`Failed to fetch profiles: ${profilesResult.error.message}`);
  }
  if (listingsResult.error) {
    throw new Error(`Failed to fetch listings: ${listingsResult.error.message}`);
  }

  const profilesById = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
  const authById = new Map(authUsers.map((u) => [u.id, u]));

  return (listingsResult.data ?? []).map((listing: any) => {
    const profile = profilesById.get(listing.seller_id);
    const auth = authById.get(listing.seller_id);
    const metadata = auth?.user_metadata ?? {};

    return {
      id: listing.id,
      title: listing.title ?? "Untitled listing",
      price: Number(listing.price ?? 0),
      category: one<any>(listing.category)?.name ?? "Uncategorised",
      status: listing.status ?? "active",
      createdAt: listing.created_at,
      seller: {
        id: listing.seller_id ?? "unknown",
        fullName:
          profile?.full_name ??
          metadata.full_name ??
          metadata.name ??
          profile?.username ??
          "Unknown seller",
        email: auth?.email ?? "No email",
        username: profile?.username ?? "unassigned",
        avatarUrl: profile?.avatar_url ?? null,
      },
    };
  });
}