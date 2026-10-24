import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { X } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import { rand } from "@/lib/format";
import { CONDITIONS } from "@/lib/marketplace-options";
import {
  DRAWER_RESET,
  activeFilterCount,
  buildHref,
  parseFilters,
} from "@/lib/marketplace-filters";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { CampusFilter } from "@/components/CampusFilter";
import { ListingCard } from "@/components/ListingCard";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { SortSelect } from "@/components/SortSelect";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | undefined>;

const TYPES = [
  { value: undefined, label: "All" },
  { value: "product", label: "Products" },
  { value: "service", label: "Services" },
] as const;

function priceLabel(min?: number, max?: number) {
  if (min != null && max != null) return `${rand(min)} to ${rand(max)}`;
  if (min != null) return `${rand(min)} and up`;
  if (max != null) return `Up to ${rand(max)}`;
  return "";
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
  const filters = parseFilters(await searchParams);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: campusRows }, { data: categoryRows }, { data: profile }] =
    await Promise.all([
      supabase
        .from("campuses")
        .select("id, name, slug")
        .eq("active", true)
        .order("name"),
      supabase.from("categories").select("id, name, slug").order("name"),
      supabase
        .from("profiles")
        .select("campus_id")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  const campuses = campusRows ?? [];
  const categories = categoryRows ?? [];
  const campus = campuses.find((c) => c.slug === filters.campus);
  const category = categories.find((c) => c.slug === filters.category);
  const mine = campuses.find((c) => c.id === profile?.campus_id);

  const listings = await getListings(supabase, {
    limit: 60,
    search: filters.q,
    type: filters.type,
    campusId: campus?.id,
    categoryId: category?.id,
    minPrice: filters.min,
    maxPrice: filters.max,
    conditions: filters.type === "service" ? undefined : filters.conditions,
    verifiedOnly: filters.verified,
    minRating: filters.rating,
    sort: filters.sort,
  });

  // Drop a category in the URL that doesn't exist, so the drawer and chips stay honest
  const effective = {
    ...filters,
    category: category?.slug,
    campus: campus?.slug,
  };

  const chips: { label: string; href: string }[] = [];
  if (category) {
    chips.push({
      label: category.name,
      href: buildHref(effective, { category: undefined }),
    });
  }
  if (filters.min != null || filters.max != null) {
    chips.push({
      label: priceLabel(filters.min, filters.max),
      href: buildHref(effective, { min: undefined, max: undefined }),
    });
  }
  if (filters.conditions.length && filters.type !== "service") {
    chips.push({
      label: filters.conditions
        .map((v) => CONDITIONS.find((c) => c.value === v)?.label ?? v)
        .join(", "),
      href: buildHref(effective, { conditions: [] }),
    });
  }
  if (filters.rating) {
    chips.push({
      label: `${filters.rating}★ & up`,
      href: buildHref(effective, { rating: undefined }),
    });
  }
  if (filters.verified) {
    chips.push({
      label: "Verified sellers",
      href: buildHref(effective, { verified: false }),
    });
  }

  const heading = filters.q ? `Results for "${filters.q}"` : "Marketplace";

  return (
    <MaxWidthWrapper className="w-full space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {heading}
          {campus ? ` · ${campus.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
          {campus ? ` at ${campus.name}` : " across all campuses"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TYPES.map((t) => (
            <Link
              key={t.label}
              href={buildHref(effective, { type: t.value })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                filters.type === t.value
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CampusFilter
            campuses={campuses.map((c) => ({ slug: c.slug, name: c.name }))}
            value={campus?.slug ?? ""}
            mine={mine?.slug}
          />
          <SortSelect value={filters.sort} />
          {/* key resets the drawer's inputs whenever the URL changes */}
          <MarketplaceFilters
            key={buildHref(effective)}
            filters={effective}
            categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70"
            >
              {chip.label}
              <X className="size-3" />
            </Link>
          ))}
          <Link
            href={buildHref(effective, DRAWER_RESET)}
            className="text-xs text-primary underline underline-offset-4"
          >
            Clear all
          </Link>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="space-y-3 py-16 text-center">
          <p className="text-muted-foreground">
            Nothing matches. Try loosening the filters.
          </p>
          {(chips.length > 0 || campus) && (
            <Link
              href={buildHref(effective, {
                ...DRAWER_RESET,
                campus: undefined,
              })}
              className="text-sm text-primary underline underline-offset-4"
            >
              Clear filters and show all campuses
            </Link>
          )}
        </div>
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
