import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { getFees } from "@/lib/fees";
import { nameOf, rand } from "@/lib/format";
import {
  currentWeek,
  mondayOf,
  shiftWeek,
  weekIsOver,
  weekLabel,
} from "@/lib/weeks";
import { CreatePayoutsButton } from "@/components/PayoutAdminButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function WeeklyPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <WeeklyContent searchParams={searchParams} />
    </Suspense>
  );
}

async function WeeklyContent({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const thisWeek = currentWeek();
  const week = /^\d{4}-\d{2}-\d{2}$/.test(sp.week ?? "")
    ? mondayOf(sp.week!)
    : thisWeek;
  const over = weekIsOver(week);

  const { supabase } = await requireAdmin();

  const [fees, { data: rows }, { data: balances }, { data: payoutRows }] =
    await Promise.all([
      getFees(supabase),
      supabase
        .from("weekly_seller_revenue")
        .select("seller_id, gross, fee, net, items_sold, orders")
        .eq("week_start", week)
        .order("gross", { ascending: false }),
      supabase.from("seller_balances").select("seller_id, available"),
      supabase
        .from("payouts")
        .select("seller_id, status")
        .eq("period_start", week),
    ]);

  const list = (rows ?? []) as any[];
  const ids = list.map((r) => r.seller_id as string);

  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, shop_name")
        .in("id", ids)
    : { data: [] as any[] };

  const names = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const owed = new Map(
    (balances ?? []).map((b: any) => [b.seller_id, Number(b.available)]),
  );
  const payouts = new Map(
    (payoutRows ?? []).map((p: any) => [p.seller_id, p.status as string]),
  );

  const sum = (k: "gross" | "fee" | "net") =>
    list.reduce((acc, r) => acc + Number(r[k]), 0);

  const nav = "rounded-md border p-2 hover:bg-muted";

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Weekly revenue</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Weeks run Monday to Sunday. A sale counts in the week the buyer
            confirms it. The seller fee ({(fees.sellerRate * 100).toFixed(0)}%,
            capped at {rand(fees.sellerMonthlyCap)} a month) is already taken
            off, so "Net" is what the seller is paid.
          </p>
        </div>
        <CreatePayoutsButton
          weekStart={week}
          disabled={!over || list.length === 0}
        />
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/admin/weekly?week=${shiftWeek(week, -1)}`}
          className={nav}
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <p className="min-w-44 text-center text-sm font-medium">
          {weekLabel(week)}
          {week === thisWeek && (
            <span className="ml-2 text-xs text-muted-foreground">
              (this week)
            </span>
          )}
        </p>
        <Link
          href={`/admin/weekly?week=${shiftWeek(week, 1)}`}
          className={nav}
          aria-label="Next week"
          aria-disabled={week >= thisWeek}
        >
          <ChevronRight className="size-4" />
        </Link>
        {week !== thisWeek && (
          <Link
            href="/admin/weekly"
            className="text-xs text-primary underline underline-offset-4"
          >
            Jump to this week
          </Link>
        )}
      </div>

      {!over && (
        <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          This week isn't over yet, so the numbers can still change and payouts
          can't be created.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Sales", value: sum("gross") },
          { label: "Fees charged", value: sum("fee") },
          { label: "Net to sellers", value: sum("net") },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-semibold">{rand(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No completed sales this week.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Owed now</TableHead>
                <TableHead className="text-right">Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => {
                const p: any = names.get(r.seller_id);
                const gross = Number(r.gross);
                const fee = Number(r.fee);
                const capped = fee < gross * fees.sellerRate - 0.005;
                const status = payouts.get(r.seller_id);

                return (
                  <TableRow key={r.seller_id}>
                    <TableCell className="font-medium">
                      {p?.shop_name || nameOf(p, "Seller")}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(r.orders)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(r.items_sold)}
                    </TableCell>
                    <TableCell className="text-right">{rand(gross)}</TableCell>
                    <TableCell className="text-right">
                      {rand(fee)}
                      {capped && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Cap
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {rand(r.net)}
                    </TableCell>
                    <TableCell className="text-right">
                      {rand(owed.get(r.seller_id) ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {status === "paid"
                        ? "Paid"
                        : status === "requested"
                          ? "To pay"
                          : "Not created"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right">
                  {rand(sum("gross"))}
                </TableCell>
                <TableCell className="text-right">{rand(sum("fee"))}</TableCell>
                <TableCell className="text-right font-semibold">
                  {rand(sum("net"))}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
