import { Suspense } from "react";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one, rand, shortId } from "@/lib/format";
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
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export default function DisputesPage({
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
      <DisputesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DisputesContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.status)
    ? sp.status!
    : "active";

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("disputes")
    .select(
      `id, reason, photos, status, created_at, order_id,
       opener:profiles!opened_by ( username, full_name ),
       order:orders!order_id ( total )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status === "active") query = query.in("status", ["open", "in_review"]);
  else if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch disputes: ${error.message}`);

  const disputes = (data ?? []) as any[];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          Orders that a buyer or seller has asked the team to look into.
        </p>
      </div>

      <FilterTabs
        basePath="/admin/disputes"
        current={status}
        filters={FILTERS}
      />

      {disputes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {status === "all" ? "" : status} disputes.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Opened by</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => {
                const photoCount: number = d.photos?.length ?? 0;

                return (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {shortId(d.order_id)}
                    </TableCell>
                    <TableCell>{rand(one<any>(d.order)?.total)}</TableCell>
                    <TableCell className="max-w-48">
                      <span className="block truncate">{d.reason}</span>
                      {photoCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {photoCount} photo{photoCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{nameOf(one<any>(d.opener))}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(d.created_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/disputes/${d.id}`}
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
 