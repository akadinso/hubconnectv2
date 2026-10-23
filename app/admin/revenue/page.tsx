import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { rand } from "@/lib/format";
import { monthName } from "@/lib/months";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RevenuePage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <RevenueContent />
    </Suspense>
  );
}

async function RevenueContent() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.from("platform_revenue").select("*");
  if (error) throw new Error(`Failed to load revenue: ${error.message}`);

  const rows = (data ?? []).map((r: any) => ({
    month: String(r.month).slice(0, 7),
    orders: Number(r.orders),
    sales: Number(r.sales_volume),
    buyerFees: Number(r.buyer_fees),
    sellerFees: Number(r.seller_fees),
  }));

  const sum = (k: "orders" | "sales" | "buyerFees" | "sellerFees") =>
    rows.reduce((acc, r) => acc + r[k], 0);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Revenue</h1>
        <p className="text-sm text-muted-foreground">
          Buyer fees are shown before PayFast's charges, so they aren't profit
          yet. Seller fees are counted when a buyer confirms and the money is
          released.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No paid orders yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Sales volume</TableHead>
                <TableHead className="text-right">Buyer fees</TableHead>
                <TableHead className="text-right">Seller fees</TableHead>
                <TableHead className="text-right">Total fees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="font-medium">
                    {monthName(r.month)}
                  </TableCell>
                  <TableCell className="text-right">{r.orders}</TableCell>
                  <TableCell className="text-right">{rand(r.sales)}</TableCell>
                  <TableCell className="text-right">
                    {rand(r.buyerFees)}
                  </TableCell>
                  <TableCell className="text-right">
                    {rand(r.sellerFees)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {rand(r.buyerFees + r.sellerFees)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">All time</TableCell>
                <TableCell className="text-right">{sum("orders")}</TableCell>
                <TableCell className="text-right">
                  {rand(sum("sales"))}
                </TableCell>
                <TableCell className="text-right">
                  {rand(sum("buyerFees"))}
                </TableCell>
                <TableCell className="text-right">
                  {rand(sum("sellerFees"))}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {rand(sum("buyerFees") + sum("sellerFees"))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
