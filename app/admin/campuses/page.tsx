import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { rand } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CampusesPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <CampusesContent />
    </Suspense>
  );
}

async function CampusesContent() {
  const { supabase } = await requireAdmin();

  const [{ data, error }, { count: noCampus }] = await Promise.all([
    supabase
      .from("campus_stats")
      .select("*")
      .order("sales", { ascending: false }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("campus_id", null),
  ]);
  if (error) throw new Error(`Failed to load campus stats: ${error.message}`);

  const rows = (data ?? []).map((r: any) => ({
    id: r.id as string,
    name: r.name as string,
    users: Number(r.users),
    sellers: Number(r.sellers),
    listings: Number(r.active_listings),
    purchases: Number(r.purchases),
    sales: Number(r.sales),
  }));

  const sum = (k: "users" | "sellers" | "listings" | "purchases" | "sales") =>
    rows.reduce((acc, r) => acc + r[k], 0);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Campuses</h1>
        <p className="text-sm text-muted-foreground">
          Purchases are counted at the buyer's campus. Sales are counted at the
          campus where the item was listed.
        </p>
      </div>

      {!!noCampus && (
        <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          {noCampus} {noCampus === 1 ? "user hasn't" : "users haven't"} chosen a
          campus yet.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campus</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Sellers</TableHead>
              <TableHead className="text-right">Active listings</TableHead>
              <TableHead className="text-right">Purchases</TableHead>
              <TableHead className="text-right">Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">{r.users}</TableCell>
                <TableCell className="text-right">{r.sellers}</TableCell>
                <TableCell className="text-right">{r.listings}</TableCell>
                <TableCell className="text-right">{r.purchases}</TableCell>
                <TableCell className="text-right">{rand(r.sales)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">All campuses</TableCell>
              <TableCell className="text-right">{sum("users")}</TableCell>
              <TableCell className="text-right">{sum("sellers")}</TableCell>
              <TableCell className="text-right">{sum("listings")}</TableCell>
              <TableCell className="text-right">{sum("purchases")}</TableCell>
              <TableCell className="text-right font-semibold">
                {rand(sum("sales"))}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
