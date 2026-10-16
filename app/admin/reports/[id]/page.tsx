import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { formatDate, nameOf, one, rand } from "@/lib/format";
import { resolveReport } from "@/app/actions/trust";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { ResolutionPanel } from "@/components/ResolutionPanel";
import { signedPhotoUrls } from "@/lib/photos";
import { PhotoGrid } from "@/components/PhotoGrid";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">Report</MaxWidthWrapper>
      }
    >
      <ReportContent params={params} />
    </Suspense>
  );
}

async function ReportContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: report } = await supabase
    .from("reports")
    .select(
      `id, kind, reason, details, status, admin_note, created_at, target_listing_id,
       reporter:profiles!reporter_id ( username, full_name ),
       target:profiles!target_user_id ( username, full_name ),
       listing:listings!target_listing_id (
         id, title, price, image_url, status,
         seller:profiles!seller_id ( username, full_name )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!report) notFound();

  const listing = one<any>(report.listing);
  const closed = report.status !== "open";
  const photos = await signedPhotoUrls(
    supabase,
    "report-photos",
    report.photos,
  );

  const actions = [
    {
      label: "Mark resolved",
      run: resolveReport.bind(null, id, "resolved", false),
    },
    ...(report.kind === "listing" && listing
      ? [
          {
            label: "Archive listing & resolve",
            variant: "destructive" as const,
            run: resolveReport.bind(null, id, "resolved", true),
          },
        ]
      : []),
    {
      label: "Dismiss",
      variant: "outline" as const,
      run: resolveReport.bind(null, id, "dismissed", false),
    },
  ];

  return (
    <MaxWidthWrapper className="w-full max-w-3xl space-y-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Admin dashboard
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold capitalize">
          Report: {report.kind === "problem" ? "Problem" : report.kind}
        </h1>
        <StatusBadge status={report.status} />
      </div>

      {report.kind === "listing" && listing && (
        <section className="flex gap-4 rounded-xl border p-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {listing.image_url && (
              <Image
                src={listing.image_url}
                alt={listing.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <Link
              href={`/listings/${listing.id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {listing.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {rand(listing.price)} · Seller: {nameOf(one<any>(listing.seller))}
            </p>
            <StatusBadge
              status={listing.status === "active" ? "resolved" : "dismissed"}
            />
          </div>
        </section>
      )}

      {report.kind === "user" && (
        <section className="rounded-xl border p-4 text-sm">
          <p className="text-muted-foreground">Reported user</p>
          <p className="font-medium">{nameOf(one<any>(report.target))}</p>
        </section>
      )}

      <section className="space-y-2 rounded-xl border p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Reported by</p>
          <p>
            {nameOf(one<any>(report.reporter))} ·{" "}
            {formatDate(report.created_at)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Reason</p>
          <p>{report.reason}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Details</p>
          <p>{report.details || "None provided."}</p>
        </div>
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
        closedNote={report.admin_note}
      />
    </MaxWidthWrapper>
  );
}
