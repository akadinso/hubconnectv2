import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one } from "@/lib/format";
import { ApplicationActions } from "@/components/ApplicationActions";
import { FilterTabs } from "@/components/FilterTabs";
import { StatusBadge } from "@/components/StatusBadge";

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const BADGE: Record<string, string> = {
  pending: "open",
  approved: "resolved",
  rejected: "dismissed",
};

export default function SellerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.status)
    ? sp.status!
    : "pending";

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("seller_applications")
    .select(
      `id, business_name, description, offering, status, admin_note, created_at,
       applicant:profiles!user_id ( username, full_name ),
       category:categories!category_id ( name )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch applications: ${error.message}`);

  const apps = (data ?? []) as any[];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Seller applications</h1>
        <p className="text-sm text-muted-foreground">
          Approving someone makes them a seller straight away.
        </p>
      </div>

      <FilterTabs
        basePath="/admin/seller-applications"
        current={status}
        filters={FILTERS}
      />

      {apps.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {status === "all" ? "" : status} applications.
        </p>
      ) : (
        <ul className="space-y-4">
          {apps.map((a) => (
            <li key={a.id} className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.business_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {nameOf(one<any>(a.applicant))} · {formatDate(a.created_at)}{" "}
                    · <span className="capitalize">{a.offering}</span>
                    {one<any>(a.category)?.name
                      ? ` · ${one<any>(a.category).name}`
                      : ""}
                  </p>
                </div>
                <StatusBadge status={BADGE[a.status]} />
              </div>

              <p className="text-sm">{a.description}</p>

              {a.status === "pending" ? (
                <ApplicationActions id={a.id} />
              ) : (
                a.admin_note && (
                  <p className="text-sm text-muted-foreground">
                    Note: {a.admin_note}
                  </p>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
