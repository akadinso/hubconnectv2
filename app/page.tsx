import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import { CarouselComponent } from "@/components/CarouselComponent";
import { ListingTabs } from "@/components/ListingTabs";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");

  const role = profile?.role;

  const [recommended, allListings, newArrivals] = await Promise.all([
    getListings(supabase, { limit: 12, sort: "rating" }),
    getListings(supabase, { limit: 20 }),
    getListings(supabase, { limit: 20, sort: "newest" }),
  ]);

  return (
    <div className="flex min-h-screen flex-col gap-10 py-10">
      <MaxWidthWrapper className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <Sparkles className="size-5" />
            Recommended for you
          </h1>

          <Link href="/marketplace">
            <Button>View More</Button>
          </Link>
        </div>

        <CarouselComponent variant="compact" listings={recommended} />
      </MaxWidthWrapper>

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
