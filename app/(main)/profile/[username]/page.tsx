import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Flag, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import { formatDate, initialsOf } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ListingCard } from "@/components/ListingCard";
import { ReportDialog } from "@/components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <ProfileContent params={params} />
    </Suspense>
  );
}

async function ProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const handle = decodeURIComponent(username).toLowerCase();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, role, verified, created_at",
    )
    .eq("username", handle)
    .maybeSingle();

  if (!profile) notFound();

  const isOwn = profile.id === user.id;
  const name = profile.full_name || profile.username || "Member";
  const listings = await getListings(supabase, {
    sellerId: profile.id,
    limit: 60,
  });

  const reviewCount = listings.reduce(
    (sum, l) => sum + (l.reviewCount ?? 0),
    0,
  );
  const weighted = listings.reduce(
    (sum, l) => sum + (l.rating ?? 0) * (l.reviewCount ?? 0),
    0,
  );
  const average = reviewCount > 0 ? weighted / reviewCount : null;

  const stats = [
    { label: "Listings", value: listings.length },
    { label: "Reviews", value: reviewCount },
    { label: "Rating", value: average != null ? average.toFixed(1) : "n/a" },
  ];

  return (
    <MaxWidthWrapper className="w-full space-y-8 py-8">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar className="size-24">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={name} />
          )}
          <AvatarFallback className="text-2xl">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <span className="truncate">{name}</span>
              {profile.verified && (
                <BadgeCheck className="size-5 shrink-0 text-primary" />
              )}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              @{profile.username}
              {profile.role !== "buyer" && (
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
              )}
              <span>· Member since {formatDate(profile.created_at)}</span>
            </p>
          </div>

          {profile.bio && (
            <p className="max-w-prose text-sm leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-6 pt-1">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-lg font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            {isOwn ? (
              <Link href="/settings/profile">
                <Button variant="outline" size="sm">
                  <Pencil />
                  Edit profile
                </Button>
              </Link>
            ) : (
              <ReportDialog
                kind="user"
                targetUserId={profile.id}
                trigger={
                  <Button variant="ghost" size="sm" type="button">
                    <Flag />
                    Report user
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Listings</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </MaxWidthWrapper>
  );
}
