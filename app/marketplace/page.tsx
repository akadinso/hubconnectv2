import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ListingCard } from "@/components/ListingCard";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string; type?: string };

const TYPES = [
  { value: undefined, label: "All" },
  { value: "product", label: "Products" },
  { value: "service", label: "Services" },
] as const;

function hrefFor(q: string, type?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

export default function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const type =
    sp.type === "product" || sp.type === "service" ? sp.type : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const listings = await getListings(supabase, {
    limit: 60,
    search: q,
    type,
  });

  return (
    <MaxWidthWrapper className="w-full space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {q ? `Results for "${q}"` : "Marketplace"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
        </p>
      </div>

      <div className="flex gap-2">
        {TYPES.map((t) => (
          <Link
            key={t.label}
            href={hrefFor(q, t.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              type === t.value
                ? "border-foreground bg-foreground text-background"
                : "hover:bg-muted",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Nothing found. Try a different search.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </MaxWidthWrapper>
  );
}
