import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import { CarouselComponent } from "@/components/CarouselComponent";
import { ListingTabs } from "@/components/ListingTabs";

export default async function Home() {
  const supabase = await createClient();

  // 1. Authenticate User
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/auth/login");

  // 2. Fetch User Profile & Onboarding Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

  const isAdmin = profile?.role === "admin";

  // 3. Parallel Listing Queries
  const [recommended, allListings, newArrivals] = await Promise.all([
    getListings(supabase, { limit: 12, sort: "rating" }),
    getListings(supabase, { limit: 20 }),
    getListings(supabase, { limit: 20, sort: "newest" }),
  ]);

  return (
    <div className="flex min-h-screen flex-col gap-10 py-10">
      {/* Admin Quick Action Banner */}
      {isAdmin && (
        <MaxWidthWrapper className="w-full">
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" />
              <span>Signed in as Administrator</span>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin">Open Admin Dashboard</Link>
            </Button>
          </div>
        </MaxWidthWrapper>
      )}

      {/* Recommended Section */}
      <MaxWidthWrapper className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <Sparkles className="size-5 text-amber-500 fill-amber-500/20" />
            Recommended for you
          </h1>

          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace">View More</Link>
          </Button>
        </div>

        <CarouselComponent variant="compact" listings={recommended} />
      </MaxWidthWrapper>

      {/* Main Listings Tabs */}
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
