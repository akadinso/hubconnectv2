import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one, rand, shortId } from "@/lib/format";
import { resolveDispute } from "@/app/actions/trust";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { ResolutionPanel } from "@/components/ResolutionPanel";
import { signedPhotoUrls } from "@/lib/photos";
import { PhotoGrid } from "@/components/PhotoGrid";

export default function DisputePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">Dispute</MaxWidthWrapper>
      }
    >
      <DisputeContent params={params} />
    </Suspense>
  );
}

async function DisputeContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: dispute } = await supabase
    .from("disputes")
    .select(
      `id, reason, details, photos, status, admin_note, created_at, resolved_at, order_id,
 opener:profiles!opened_by ( username, full_name ),
       order:orders!order_id (
         id, total, payment_status, payfast_payment_id, paid_at, created_at,
         buyer:profiles!buyer_id ( username, full_name ),
         items:order_items (
           id, title, unit_price, quantity, status,
           seller:profiles!seller_id ( username, full_name )
         )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!dispute) notFound();

  const order = one<any>(dispute.order);
  const items: any[] = order?.items ?? [];
  const photos = await signedPhotoUrls(
    supabase,
    "report-photos",
    dispute.photos,
  );
  const closed =
    dispute.status === "resolved" || dispute.status === "dismissed";

  const actions = [
    ...(dispute.status === "open"
      ? [
          {
            label: "Mark in review",
            variant: "secondary" as const,
            run: resolveDispute.bind(null, id, "in_review"),
          },
        ]
      : []),
    { label: "Resolve", run: resolveDispute.bind(null, id, "resolved") },
    {
      label: "Dismiss",
      variant: "outline" as const,
      run: resolveDispute.bind(null, id, "dismissed"),
    },
  ];

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Admin dashboard
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          Dispute: Order {shortId(dispute.order_id)}
        </h1>
        <StatusBadge status={dispute.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Dispute</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Opened by</dt>
              <dd>{nameOf(one<any>(dispute.opener))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Opened on</dt>
              <dd>{formatDate(dispute.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reason</dt>
              <dd>{dispute.reason}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Details</dt>
              <dd>{dispute.details || "None provided."}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Order</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Buyer</dt>
              <dd>{nameOf(one<any>(order?.buyer))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd>{rand(order?.total)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="capitalize">
                {order?.payment_status}
                {order?.paid_at ? ` on ${formatDate(order.paid_at)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">PayFast reference</dt>
              <dd>{order?.payfast_payment_id ?? "n/a"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Items</h2>
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  Seller: {nameOf(one<any>(item.seller))} · {item.quantity} ×{" "}
                  {rand(item.unit_price)}
                </p>
              </div>
              <StatusBadge
                status={item.status === "pending" ? "open" : item.status}
              />
            </li>
          ))}
        </ul>
      </section>
      {photos.length > 0 && (
        <section className="space-y-2 rounded-xl border p-4">
          <p className="text-sm font-medium">Photos from the reporter</p>
          <PhotoGrid urls={photos} />
        </section>
      )}
      <ResolutionPanel
        actions={actions}
        closed={closed}
        closedNote={dispute.admin_note}
      />
    </MaxWidthWrapper>
  );
}
