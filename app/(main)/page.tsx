import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { CarouselComponent } from "@/components/CarouselComponent";
import { ListingTabs } from "@/components/ListingTabs";

export default async function Home() {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/auth/login");

  // 2. Profile and onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded, campus_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded || !profile?.campus_id) redirect("/onboarding");
  const isAdmin = profile.role === "admin";
  const canSell = profile.role === "seller" || isAdmin;

  // Sellers go straight to the new listing form; everyone else applies first
  const sellHref = canSell ? "/seller/listings/new" : "/seller/onboarding";

  // 3. Listings
  const [recommended, allListings, newArrivals] = await Promise.all([
    getListings(supabase, { limit: 12, sort: "rating" }),
    getListings(supabase, { limit: 20 }),
    getListings(supabase, { limit: 20, sort: "newest" }),
  ]);

  return (
    <div className="flex flex-col gap-10 pb-12">
      <Hero sellHref={sellHref} />

      {/* Admin quick action banner */}
      {isAdmin && (
        <MaxWidthWrapper className="w-full">
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" />
              <span>Signed in as Administrator</span>
            </div>
            <Link href="/admin">
              <Button size="sm" variant="outline">
                Open Admin Dashboard
              </Button>
            </Link>
          </div>
        </MaxWidthWrapper>
      )}

      {/* Recommended */}
      <MaxWidthWrapper className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <Sparkles className="size-5 fill-amber-500/20 text-amber-500" />
            Recommended for you
          </h2>

          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              View More
            </Button>
          </Link>
        </div>

        <CarouselComponent variant="compact" listings={recommended} />
      </MaxWidthWrapper>

      {/* All listings and new arrivals */}
      <MaxWidthWrapper className="w-full">
        <ListingTabs
          tabs={[
            { value: "all", label: "All Listings", listings: allListings },
            { value: "new", label: "New Arrivals", listings: newArrivals },
          ]}
        />
      </MaxWidthWrapper>
    </div>
  );
}
