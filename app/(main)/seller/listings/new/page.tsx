import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireSeller } from "@/lib/seller";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ListingWizard } from "@/components/ListingWizard";

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}

async function NewListingContent() {
  const { supabase, profile, seller } = await requireSeller();

  const [{ data: categories }, { data: campuses }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("campuses")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-6 py-8">
      <Link
        href="/seller"
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Seller dashboard
      </Link>
      <ListingWizard
        categories={categories ?? []}
        campuses={campuses ?? []}
        defaultCampusId={profile?.campus_id ?? null}
        seller={seller}
      />
    </MaxWidthWrapper>
  );
}
