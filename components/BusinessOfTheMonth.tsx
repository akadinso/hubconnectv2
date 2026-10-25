import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { initialsOf, one } from "@/lib/format";
import { monthName } from "@/lib/months";
import { cn } from "@/lib/utils";

export async function BusinessOfTheMonth({
  supabase,
}: {
  supabase: SupabaseClient;
}) {
  const { data } = await supabase
    .from("business_of_month")
    .select(
      "month, blurb, seller:profiles!seller_id ( username, full_name, shop_name, avatar_url, tagline )",
    )
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const seller = one<any>(data.seller);
  if (!seller?.username) return null;

  const name = seller.shop_name || seller.full_name || seller.username;

  return (
    <MaxWidthWrapper className="w-full">
      <section className="flex flex-col gap-4 rounded-2xl border border-gold/60 bg-gold-lite/40 p-5 sm:flex-row sm:items-center">
        <Avatar className="size-16 shrink-0">
          {seller.avatar_url && (
            <AvatarImage src={seller.avatar_url} alt={name} />
          )}
          <AvatarFallback className="text-lg">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark">
            Business of the Month · {monthName(String(data.month).slice(0, 7))}
          </p>
          <p className="text-lg font-bold">{name}</p>
          {(data.blurb || seller.tagline) && (
            <p className="text-sm text-muted-foreground">
              {data.blurb || seller.tagline}
            </p>
          )}
        </div>

        <Link
          href={`/profile/${seller.username}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Visit their store
        </Link>
      </section>
    </MaxWidthWrapper>
  );
}
