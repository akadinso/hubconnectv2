import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Flag, MessageCircle, Star } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { initialsOf, one } from "@/lib/format";
import { publicPhotoUrls } from "@/lib/photos";
import {
  DAYS,
  conditionLabel,
  rateSuffix,
  studentStatus,
} from "@/lib/marketplace-options";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListingActions } from "@/components/ListingActions";
import { ListingGallery } from "@/components/ListingGallery";
import { ReviewForm } from "@/components/ReviewForm";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ReportDialog } from "@/components/ReportDialog";
import { startConversation } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        `id, title, description, image_url, images, price, type, condition, rate_type,
         availability, rating, review_count, created_at, seller_id,
         seller:profiles!seller_id ( id, username, full_name, shop_name, avatar_url, verified, expected_graduation ),
         category:categories!category_id ( name )`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select(
        `id, rating, comment, photos, created_at, reviewer_id,
         reviewer:profiles!reviewer_id ( username, full_name, avatar_url )`,
      )
      .eq("listing_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!listing) notFound();

  const { data: statsData } = await supabase.rpc("seller_public_stats", {
    sid: listing.seller_id,
  });
  const stats: any = Array.isArray(statsData) ? statsData[0] : statsData;
  const sold = Number(stats?.items_sold ?? 0);
  const sellerRating = stats?.rating != null ? Number(stats.rating) : null;
  const sellerReviews = Number(stats?.review_count ?? 0);

  const seller = one<any>(listing.seller);
  const category = one<any>(listing.category);
  const reviews = (reviewRows ?? []) as any[];

  const isOwner = listing.seller_id === user.id;
  const myReview = reviews.find((r) => r.reviewer_id === user.id) ?? null;

  const sellerName =
    seller?.shop_name || seller?.full_name || seller?.username || "Seller";
  const student = studentStatus(seller?.expected_graduation);

  const images: string[] = listing.images?.length
    ? listing.images
    : listing.image_url
      ? [listing.image_url]
      : [];

  const price = listing.price != null ? Number(listing.price) : null;
  const isService = listing.type === "service";
  const days = DAYS.filter((d) =>
    (listing.availability ?? []).includes(d.value),
  );

  return (
    <MaxWidthWrapper className="w-full space-y-10 py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ListingGallery images={images} alt={listing.title} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-gold-lite capitalize text-gold-dark"
            >
              {listing.type}
            </Badge>
            {category?.name && <Badge variant="outline">{category.name}</Badge>}
            {!isService && conditionLabel(listing.condition) && (
              <Badge variant="outline">
                {conditionLabel(listing.condition)}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>

          <p className="text-3xl font-bold text-primary">
            {price != null ? `R${price.toFixed(2)}` : "Price on request"}
            {isService && listing.rate_type && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {rateSuffix(listing.rate_type)}
              </span>
            )}
          </p>

          {listing.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          )}

          {isService && days.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Available</p>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <Badge key={d.value} variant="secondary">
                    {d.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Seller */}
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-14">
              {seller?.avatar_url && (
                <AvatarImage src={seller.avatar_url} alt={sellerName} />
              )}
              <AvatarFallback>{initialsOf(sellerName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              {seller?.username ? (
                <Link
                  href={`/profile/${seller.username}`}
                  className="block truncate text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {sellerName}
                </Link>
              ) : (
                <p className="truncate text-sm font-semibold">{sellerName}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {seller?.verified && (
                  <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <BadgeCheck className="size-4 text-primary" />
                    Verified seller
                  </span>
                )}
                <Badge className="bg-gold-lite text-[10px] text-gold-dark hover:bg-gold-lite">
                  {student.label === "Alumni" ? "Alumni" : "Active student"}
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">
                {sellerRating != null
                  ? `${sellerRating.toFixed(1)} (${sellerReviews})`
                  : "No reviews"}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {sold} sold
              </p>
            </div>
          </div>

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
                  image: images[0] ?? null,
                }}
              />
              <form action={startConversation.bind(null, listing.id)}>
                <Button variant="outline" className="w-full" type="submit">
                  <MessageCircle />
                  Message Seller
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Want a different price? Message the seller to make an offer.
              </p>
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
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          Reviews ({reviews.length})
          {listing.rating != null && (
            <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
              {Number(listing.rating).toFixed(1)}
            </span>
          )}
        </h2>

        {!isOwner && (
          <ReviewForm
            listingId={listing.id}
            initialRating={myReview?.rating ?? 0}
            initialComment={myReview?.comment ?? ""}
            isEditing={!!myReview}
            existingPhotoCount={myReview?.photos?.length ?? 0}
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
                            timeZone: "Africa/Johannesburg",
                          },
                        )}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <PhotoGrid
                      urls={publicPhotoUrls(
                        supabase,
                        "review-photos",
                        review.photos,
                      )}
                      className="pt-1"
                    />
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
          <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
