import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/lib/listings";
import { initialsOf, rand } from "@/lib/format";
import { studentStatus } from "@/lib/marketplace-options";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ReportDialog } from "@/components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { startConversationWithSeller } from "../actions";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
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
      "id, username, full_name, shop_name, tagline, shop_tags, avatar_url, verified, role, expected_graduation",
    )
    .eq("username", handle)
    .maybeSingle();
  if (!profile) notFound();

  const [listings, statsRes] = await Promise.all([
    getListings(supabase, { sellerId: profile.id, limit: 60 }),
    supabase.rpc("seller_public_stats", { sid: profile.id }),
  ]);

  const stats: any = Array.isArray(statsRes.data)
    ? statsRes.data[0]
    : statsRes.data;
  const sold = Number(stats?.items_sold ?? 0);
  const reviewCount = Number(stats?.review_count ?? 0);
  const rating = stats?.rating != null ? Number(stats.rating) : null;

  const isOwn = profile.id === user.id;
  const name =
    profile.shop_name || profile.full_name || profile.username || "Member";
  const student = studentStatus(profile.expected_graduation);
  const tags: string[] = profile.shop_tags ?? [];

  return (
    <MaxWidthWrapper className="w-full space-y-8 py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Avatar className="size-28 shrink-0">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={name} />
          )}
          <AvatarFallback className="text-3xl">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-2xl font-bold">{name}</h1>

          <div>
            <p className="font-medium">
              {rating != null
                ? `${rating.toFixed(1)} (${reviewCount} review${reviewCount === 1 ? "" : "s"})`
                : "No reviews yet"}
            </p>
            {profile.tagline && (
              <p className="text-xs text-muted-foreground">{profile.tagline}</p>
            )}
          </div>

          <div className="flex gap-6 text-sm">
            <p>
              <span className="text-base font-bold">{sold}</span> items sold
            </p>
            <p>
              <span className="text-base font-bold">{listings.length}</span>{" "}
              active listings
            </p>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="bg-gold-lite text-[10px] font-normal text-gold-dark"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap items-start gap-3 lg:justify-end">
            {profile.verified && (
              <Badge className="gap-1 px-4 py-1.5 text-sm">
                <BadgeCheck className="size-4" />
                Verified
              </Badge>
            )}
            <div className="space-y-1 text-center">
              <Badge className="bg-gold-lite px-4 py-1.5 text-xs text-gold-dark hover:bg-gold-lite">
                {student.label}
              </Badge>
              {student.note && (
                <p className="max-w-44 text-[10px] text-muted-foreground">
                  {student.note}
                </p>
              )}
            </div>
          </div>

          {isOwn ? (
            <Link href="/settings/profile">
              <Button variant="outline" size="sm">
                <Pencil />
                Edit profile
              </Button>
            </Link>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <form action={startConversationWithSeller.bind(null, profile.id)}>
                <Button type="submit">Message</Button>
              </form>
              <ReportDialog
                kind="user"
                targetUserId={profile.id}
                trigger={
                  <Button variant="ghost" type="button">
                    Report user
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Active Listings</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active listings.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="group space-y-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-sm">
                  {l.image && (
                    <Image
                      src={l.image}
                      alt={l.title}
                      fill
                      sizes="(min-width: 1024px) 20vw, 45vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="truncate text-sm font-medium">{l.title}</p>
                <p className="text-sm font-bold text-primary">
                  {rand(l.price)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </MaxWidthWrapper>
  );
}
