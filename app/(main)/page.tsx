import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import { CarouselComponent } from "@/components/CarouselComponent";
import { ListingTabs } from "@/components/ListingTabs";
import Image from "next/image";

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
    <div className="flex min-h-screen flex-col gap-10">
      <MaxWidthWrapper className="flex gap-6 bg-primary w-full h-full py-53">
        <div className="flex flex-col gap-6 w-full">
          <h1 className="text-xl font-normal tracking-tight text-gold uppercase">
            Eduvos Incubator Hub Marketplace
          </h1>
          <p className="text-6xl text-white font-bold">
            Shop student businesses <br />
            <span className="text-gold">right here at campus.</span>
          </p>
          <p className="text-md text-white font-normal mt-3">
            Handmade, homemade and second-hand – from Eduvos students, with
            payment held safely until you get your item.
          </p>
          <div className="mt-4 flex flex-row gap-2">
            <Button
              variant="default"
              className="p-6 bg-gold hover:bg-gold/90 text-primary"
            >
              <Link href="/marketplace">Start Shopping</Link>
            </Button>
            <Button variant="secondary" className="p-6">
              <Link href="/marketplace">Sell Something</Link>
            </Button>
          </div>
        </div>

        <div>
          <Image
            src="/placeholder-image.jpg"
            alt="Placeholder"
            width={800}
            height={400}
          />
        </div>
      </MaxWidthWrapper>
      {/* Admin Quick Action Banner */}
      {isAdmin && (
        <MaxWidthWrapper className="w-full">
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" />
              <span>Signed in as Administrator</span>
            </div>
            <Button size="sm" variant="outline">
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

          <Button variant="outline" size="sm">
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
