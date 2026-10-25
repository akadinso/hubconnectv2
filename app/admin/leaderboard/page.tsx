import { Suspense } from "react";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { nameOf, one, rand } from "@/lib/format";
import { currentMonth, monthName, shiftMonth } from "@/lib/months";
import { SetBusinessOfMonth } from "@/components/SetBusinessOfMonth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <LeaderboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LeaderboardContent({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const now = currentMonth();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "")
    ? sp.month!
    : now;
  const last = shiftMonth(now, -1);

  const { supabase } = await requireAdmin();

  const [{ data: rows }, { data: spotlight }] = await Promise.all([
    supabase
      .from("seller_leaderboard")
      .select("seller_id, sales, items_sold, orders")
      .eq("month", `${month}-01`)
      .order("sales", { ascending: false })
      .limit(20),
    supabase
      .from("business_of_month")
      .select("seller_id")
      .eq("month", `${month}-01`)
      .maybeSingle(),
  ]);

  const board = (rows ?? []) as any[];
  const ids = board.map((r) => r.seller_id);

  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, shop_name")
        .in("id", ids)
    : { data: [] as any[] };

  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const tabs = [
    { value: now, label: "This month" },
    { value: last, label: "Last month" },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Sales leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by sales completed in {monthName(month)}. The Incubation Hub
          picks the top seller for Business of the Month, which is a spotlight
          on the home page and is not paid.
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={
              t.value === now
                ? "/admin/leaderboard"
                : `/admin/leaderboard?month=${t.value}`
            }
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              month === t.value
                ? "border-foreground bg-foreground text-background"
                : "hover:bg-muted",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {board.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No completed sales in {monthName(month)} yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Items sold</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">
                  Business of the Month
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {board.map((r, i) => {
                const p: any = byId.get(r.seller_id);
                return (
                  <TableRow key={r.seller_id}>
                    <TableCell className="font-semibold">{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {p?.shop_name || nameOf(p, "Seller")}
                    </TableCell>
                    <TableCell className="text-right">
                      {rand(r.sales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(r.items_sold)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(r.orders)}
                    </TableCell>
                    <TableCell className="text-right">
                      <SetBusinessOfMonth
                        month={month}
                        sellerId={r.seller_id}
                        isCurrent={spotlight?.seller_id === r.seller_id}
                      />
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
