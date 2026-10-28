import { Suspense } from "react";
import Link from "next/link";
import {
  createClient as createSupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { DataTable } from "@/components/data-table";
import { ListingsTable, type AdminListing } from "@/components/listings-table";
import { SectionCards } from "@/components/section-cards";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one, rand, shortId } from "@/lib/format";
import { getOpenDisputes } from "@/lib/admin-queue";

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

// Service-role client: server only, and only used after requireAdmin() passes
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const head = { count: "exact", head: true } as const;

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const { supabase } = await requireAdmin();
  const service = getServiceClient();

  const authUsers: User[] = [];
  let page = 1;
  const perPage = 100;

  // Note: Consider replacing this loop with searchParams-based server pagination for production scale
  while (true) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);

    authUsers.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  const [
    profilesResult,
    listingsResult,
    openReportsRes,
    openDisputesRes,
    paidOrdersRes,
    reportRows,
    disputeRows,
    revenueRes,
  ] = await Promise.all([
    service
      .from("profiles")
      .select(
        "id, username, full_name, bio, avatar_url, role, verified, onboarded, created_at",
      ),
    service
      .from("listings")
      .select(
        "id, title, price, status, created_at, seller_id, category:categories!category_id ( name )",
      ),
    supabase.from("reports").select("*", head).eq("status", "open"),
    getOpenDisputes(supabase),
    supabase.from("orders").select("*", head).eq("payment_status", "paid"),
    supabase
      .from("reports")
      .select(
        `id, kind, reason, created_at,
         reporter:profiles!reporter_id ( username, full_name ),
         target:profiles!target_user_id ( username, full_name ),
         listing:listings!target_listing_id ( title )`,
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("disputes")
      .select(
        `id, reason, status, created_at, order_id,
         opener:profiles!opened_by ( username, full_name ),
         order:orders!order_id ( total )`,
      )
      .in("status", ["open", "in_review"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("platform_revenue")
      .select("sales_volume, buyer_fees, seller_fees"),
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

  const openDisputeRows = disputeRows.data ?? [];

  const profiles = profilesResult.data ?? [];
  const rawListings = listingsResult.data ?? [];
  const openReports = openReportsRes.count ?? 0;
  const openDisputes = openDisputesRes.rows?.length ?? 0;
  const paidOrders = paidOrdersRes.count ?? 0;

  const profilesById = new Map(profiles.map((p) => [p.id, p]));
  const authUsersById = new Map(authUsers.map((u) => [u.id, u]));

  const users: AdminUser[] = authUsers.map((authUser) => {
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

  const listings: AdminListing[] = rawListings.map((listing: any) => {
    const sellerProfile = profilesById.get(listing.seller_id);
    const sellerAuth = authUsersById.get(listing.seller_id);
    const metadata = sellerAuth?.user_metadata ?? {};

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
          sellerProfile?.full_name ??
          metadata.full_name ??
          metadata.name ??
          sellerProfile?.username ??
          "Unknown seller",
        email: sellerAuth?.email ?? "No email",
        username: sellerProfile?.username ?? "unassigned",
        avatarUrl: sellerProfile?.avatar_url ?? null,
      },
    };
  });

  const rev = revenueRes.data ?? [];
  const salesVolume = rev.reduce((s, r) => s + Number(r.sales_volume ?? 0), 0);
  const platformFees = rev.reduce(
    (s, r) => s + Number(r.buyer_fees ?? 0) + Number(r.seller_fees ?? 0),
    0,
  );

  const activity = [
    { label: "Open reports", value: openReports },
    { label: "Paid orders", value: paidOrders },
    { label: "Revenue", value: rand(salesVolume) },
  ];

  const reports = reportRows.data ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 md:py-6">
          {/* Top summary metrics */}
          <SectionCards
            users={users}
            totalListings={listings.length}
            salesVolume={salesVolume}
            platformFees={platformFees}
            paidOrders={paidOrders}
          />

          {/* Orders and moderation numbers */}
          <div className="grid grid-cols-2 gap-4 px-4 lg:grid-cols-4 lg:px-6">
            {activity.map((item) => (
              <Card key={item.label} className="bg-navy">
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs text-white">{item.label}</p>
                  <p className="text-2xl font-semibold text-gold">
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Moderation queues */}
          <div className="grid gap-6 px-4 lg:grid-cols-2 lg:px-6">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Open reports</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing to review.
                </p>
              ) : (
                <ul className="divide-y rounded-xl border">
                  {reports.map((r: any) => {
                    const target =
                      r.kind === "listing"
                        ? (one<any>(r.listing)?.title ?? "Deleted listing")
                        : r.kind === "user"
                          ? nameOf(one<any>(r.target))
                          : "Problem report";
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/admin/reports/${r.id}`}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              <span className="capitalize">{r.kind}</span>:{" "}
                              {target}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.reason} · by {nameOf(one<any>(r.reporter))} ·{" "}
                              {formatDate(r.created_at)}
                            </p>
                          </div>
                          <StatusBadge status="open" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* User management */}
          <div className="px-4 lg:px-6">
            <h1 className="mb-1 text-2xl font-semibold">User Management</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              All registered HubConnect users and their profile details.
            </p>
            <DataTable data={users} />
          </div>

          {/* Store management */}
          <div className="px-4 lg:px-6">
            <h1 className="mb-1 text-2xl font-semibold">Store Management</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              All marketplace listings and seller accounts.
            </p>
            <ListingsTable data={listings} />
          </div>
        </div>
      </div>
    </div>
  );
}
