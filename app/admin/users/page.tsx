import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { getAdminUsers } from "@/lib/admin-data";
import { DataTable } from "@/components/data-table";

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 lg:px-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}

async function UsersContent() {
  await requireAdmin();
  const users = await getAdminUsers();

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-1 text-2xl font-semibold">User Management</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        All registered HubConnect users and their profile details.
      </p>
      <DataTable data={users} />
    </div>
  );
}
