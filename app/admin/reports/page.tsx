import { Suspense } from "react";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one } from "@/lib/format";
import { FilterTabs } from "@/components/FilterTabs";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export default function ReportsPage({
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
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportsContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.status)
    ? sp.status!
    : "open";

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("reports")
    .select(
      `id, kind, reason, photos, status, created_at,
       reporter:profiles!reporter_id ( username, full_name ),
       target:profiles!target_user_id ( username, full_name ),
       listing:listings!target_listing_id ( title )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch reports: ${error.message}`);

  const reports = (data ?? []) as any[];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Reports on users and listings, and problems sent in by members.
        </p>
      </div>

      <FilterTabs
        basePath="/admin/reports"
        current={status}
        filters={FILTERS}
      />

      {reports.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {status === "all" ? "" : status} reports.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reported by</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => {
                const target =
                  r.kind === "listing"
                    ? (one<any>(r.listing)?.title ?? "Deleted listing")
                    : r.kind === "user"
                      ? nameOf(one<any>(r.target), "Deleted user")
                      : "General problem";
                const photoCount: number = r.photos?.length ?? 0;

                return (
                  <TableRow key={r.id}>
                    <TableCell className="capitalize">{r.kind}</TableCell>
                    <TableCell className="max-w-48 truncate font-medium">
                      {target}
                    </TableCell>
                    <TableCell className="max-w-48">
                      <span className="block truncate">{r.reason}</span>
                      {photoCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {photoCount} photo{photoCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{nameOf(one<any>(r.reporter))}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
