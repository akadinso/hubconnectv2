import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one, rand } from "@/lib/format";
import {
  CreatePayoutsButton,
  MarkPaidButton,
} from "@/components/PayoutAdminButton";
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
import Link from "next/link";
import { weekLabel } from "@/lib/weeks";

const FILTERS = [
  { value: "requested", label: "To pay" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
];

const BADGE: Record<string, string> = {
  requested: "open",
  paid: "resolved",
  rejected: "dismissed",
};

export default function PayoutsPage({
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
      <PayoutsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PayoutsContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.status)
    ? sp.status!
    : "requested";

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("payouts")
    .select(
      "id, amount, status, created_at, paid_at, period_start, seller:profiles!seller_id ( username, full_name, shop_name )",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load payouts: ${error.message}`);

  const payouts = (data ?? []) as any[];
  const owed = payouts
    .filter((p) => p.status === "requested")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Payouts</h1>
          <p className="text-sm text-muted-foreground">
            Sellers are paid every week. Each amount is already net of the
            seller fee. Send the money, then mark it paid.
          </p>
        </div>
        <Link
          href="/admin/weekly"
          className="text-sm text-primary underline underline-offset-4"
        >
          See weekly revenue
        </Link>
      </div>

      {owed > 0 && (
        <p className="rounded-lg border bg-muted/50 p-3 text-sm">
          Waiting to be paid: <strong>{rand(owed)}</strong>
        </p>
      )}

      <FilterTabs
        basePath="/admin/payouts"
        current={status}
        filters={FILTERS}
      />

      {payouts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nothing here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => {
                const seller = one<any>(p.seller);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {seller?.shop_name || nameOf(seller, "Seller")}
                    </TableCell>
                    <TableCell className="text-right">
                      {rand(p.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.period_start
                        ? weekLabel(p.period_start)
                        : formatDate(p.created_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={BADGE[p.status] ?? "open"} />
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "requested" ? (
                        <MarkPaidButton id={p.id} />
                      ) : p.paid_at ? (
                        <span className="text-xs text-muted-foreground">
                          Paid {formatDate(p.paid_at)}
                        </span>
                      ) : null}
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
