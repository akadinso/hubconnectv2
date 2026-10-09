import { redirect } from "next/navigation";
import {
  createClient as createSupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { ListingsTable, type AdminListing } from "@/components/listings-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

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

const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Authenticate Current Admin User
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { data: currentProfile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (roleError || currentProfile?.role !== "admin") {
    redirect("/");
  }

  // 2. Fetch All Auth Users
  const authUsers: User[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    authUsers.push(...data.users);

    if (data.users.length < perPage) break;
    page += 1;
  }

  const [profilesResult, listingsResult] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select(
        "id, username, bio, avatar_url, role, verified, onboarded, created_at",
      ),
    adminSupabase.from("listings").select("*"),
  ]);

  if (profilesResult.error) {
    throw new Error(
      `Failed to fetch profiles: ${profilesResult.error.message}`,
    );
  }

  if (listingsResult.error) {
    throw new Error(
      `Failed to fetch listings: ${listingsResult.error.message}`,
    );
  }

  const profiles = profilesResult.data ?? [];
  const rawListings = listingsResult.data ?? [];

  // Index profiles & auth users for quick lookup
  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );
  const authUsersById = new Map(
    authUsers.map((authUser) => [authUser.id, authUser]),
  );

  const users: AdminUser[] = authUsers.map((authUser) => {
    const profile = profilesById.get(authUser.id);
    const metadata = authUser.user_metadata ?? {};

    return {
      id: authUser.id,
      fullName:
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

  const listings: AdminListing[] = rawListings.map((listing) => {
    const sellerId =
      listing.user_id ??
      listing.seller_id ??
      listing.profile_id ??
      listing.owner_id ??
      "";
    const sellerProfile = profilesById.get(sellerId);
    const sellerAuth = authUsersById.get(sellerId);
    const metadata = sellerAuth?.user_metadata ?? {};

    const fullName =
      metadata.full_name ??
      metadata.name ??
      sellerProfile?.username ??
      "Unknown Seller";

    return {
      id: listing.id,
      title: listing.title ?? listing.name ?? "Untitled Product",
      price: Number(listing.price ?? listing.amount ?? 0),
      category: listing.category ?? "General",
      status: listing.status ?? (listing.is_active ? "active" : "inactive"),
      createdAt: listing.created_at ?? new Date().toISOString(),
      seller: {
        id: sellerId || "unknown",
        fullName,
        email: sellerAuth?.email ?? "No email",
        username: sellerProfile?.username ?? "unassigned",
        avatarUrl: sellerProfile?.avatar_url ?? null,
      },
    };
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="floating" />

      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-4 md:py-6">
              {/* Top Summary Metrics */}
              <SectionCards users={users} totalListings={listings.length} />

              {/* User Management */}
              <div className="px-4 lg:px-6">
                <h1 className="mb-1 text-2xl font-semibold">User Management</h1>
                <p className="mb-4 text-sm text-muted-foreground">
                  All registered HubConnect users and their profile details.
                </p>
                <DataTable data={users} />
              </div>

              {/* Store Management (Listings + Sellers) */}
              <div className="px-4 lg:px-6">
                <h1 className="mb-1 text-2xl font-semibold">
                  Store Management
                </h1>
                <p className="mb-4 text-sm text-muted-foreground">
                  All active marketplace listings and seller accounts.
                </p>
                <ListingsTable data={listings} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
