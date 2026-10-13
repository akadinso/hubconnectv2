import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { getAdminListings } from "@/lib/admin-data";
import { ListingsTable } from "@/components/listings-table";
import { Card, CardContent } from "@/components/ui/card";

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <StoreContent />
    </Suspense>
  );
}

async function StoreContent() {
  await requireAdmin();
  const listings = await getAdminListings();

  const count = (status: string) =>
    listings.filter((l) => l.status === status).length;

  const stats = [
    { label: "Total listings", value: listings.length },
    { label: "Active", value: count("active") },
    { label: "Draft", value: count("draft") },
    { label: "Archived", value: count("archived") },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Store Management</h1>
        <p className="text-sm text-muted-foreground">
          All marketplace listings and seller accounts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ListingsTable data={listings} />
    </div>
  );
}
