import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Flag, MessageCircle, Star } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListingActions } from "@/components/ListingActions";
import { ReviewForm } from "@/components/ReviewForm";
import { startConversation } from "./actions";
import { ReportDialog } from "@/components/ReportDialog";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Joined rows can come back as an object or a one-item array depending on typings
function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default function ListingPage({ params }: PageProps<"/listings/[id]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ListingContent params={params} />
    </Suspense>
  );
}

async function ListingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: listing }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        `id, title, description, image_url, price, type, rating, review_count,
         created_at, seller_id,
         seller:profiles!seller_id ( id, username, full_name, avatar_url, verified, bio, created_at ),
         category:categories!category_id ( name )`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select(
        `id, rating, comment, created_at, reviewer_id,
         reviewer:profiles!reviewer_id ( username, full_name, avatar_url )`,
      )
      .eq("listing_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!listing) notFound();

  const seller = one<any>(listing.seller);
  const category = one<any>(listing.category);
  const reviews = (reviewRows ?? []) as any[];

  const isOwner = listing.seller_id === user.id;
  const myReview = reviews.find((r) => r.reviewer_id === user.id) ?? null;

  const sellerName = seller?.full_name || seller?.username || "Seller";
  const sellerIsNew =
    !!seller?.created_at &&
    Date.now() - new Date(seller.created_at).getTime() <
      30 * 24 * 60 * 60 * 1000;

  const price = listing.price != null ? Number(listing.price) : null;

  return (
    <MaxWidthWrapper className="w-full space-y-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to listings
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          {listing.image_url && (
            <Image
              src={listing.image_url}
              alt={listing.title}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {listing.type}
            </Badge>
            {category?.name && <Badge variant="outline">{category.name}</Badge>}
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>

          <div className="flex items-center gap-2 text-sm">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            {listing.rating != null ? (
              <span>
                <span className="font-medium">
                  {Number(listing.rating).toFixed(1)}
                </span>{" "}
                <span className="text-muted-foreground">
                  ({listing.review_count}{" "}
                  {listing.review_count === 1 ? "review" : "reviews"})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
          </div>

          <p className="text-3xl font-semibold">
            {price != null ? `R${price.toFixed(2)}` : "Price on request"}
          </p>

          {listing.description && (
            <p className="leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          )}

          <Separator />

          {/* Seller */}
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              {seller?.avatar_url && (
                <AvatarImage src={seller.avatar_url} alt={sellerName} />
              )}
              <AvatarFallback>{initialsOf(sellerName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="truncate">{sellerName}</span>
                {seller?.verified && (
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                )}
                {sellerIsNew && (
                  <Badge variant="secondary" className="text-[10px]">
                    New Seller
                  </Badge>
                )}
              </p>
              {seller?.username && (
                <p className="text-xs text-muted-foreground">
                  @{seller.username}
                </p>
              )}
            </div>
          </div>

          {seller?.bio && (
            <p className="text-sm text-muted-foreground">{seller.bio}</p>
          )}

          {/* Actions */}
          {isOwner ? (
            <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              This is your listing.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <ListingActions
                listing={{
                  id: listing.id,
                  title: listing.title,
                  price,
                  image: listing.image_url ?? null,
                }}
              />
              <form action={startConversation.bind(null, listing.id)}>
                <Button variant="outline" className="w-full" type="submit">
                  <MessageCircle />
                  Message seller
                </Button>
              </form>
              <div className="flex gap-2">
                <ReportDialog
                  kind="listing"
                  targetListingId={listing.id}
                  trigger={
                    <Button variant="ghost" size="sm" type="button">
                      <Flag />
                      Report listing
                    </Button>
                  }
                />
                <ReportDialog
                  kind="user"
                  targetUserId={listing.seller_id}
                  trigger={
                    <Button variant="ghost" size="sm" type="button">
                      <Flag />
                      Report seller
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Reviews */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>

        {!isOwner && (
          <ReviewForm
            listingId={listing.id}
            initialRating={myReview?.rating ?? 0}
            initialComment={myReview?.comment ?? ""}
            isEditing={!!myReview}
          />
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to leave one.
          </p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((review) => {
              const reviewer = one<any>(review.reviewer);
              const name = reviewer?.full_name || reviewer?.username || "User";
              return (
                <li key={review.id} className="flex gap-3">
                  <Avatar className="size-9">
                    {reviewer?.avatar_url && (
                      <AvatarImage src={reviewer.avatar_url} alt={name} />
                    )}
                    <AvatarFallback>{initialsOf(name)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{name}</span>
                      <span className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < review.rating
                                ? "size-3.5 fill-yellow-400 text-yellow-400"
                                : "size-3.5 text-muted-foreground/40"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString(
                          "en-ZA",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </MaxWidthWrapper>
  );
}

function ListingSkeleton() {
  return (
    <MaxWidthWrapper className="w-full py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
